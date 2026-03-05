import { getApiUrl, getApiHeaders, getAltEndpoint } from "./config";
import { parseApiResponse, isRetriableError, retryDelayMs, callOpenAICompat, estimateTokens, slimPayload, ensureTokenBudget } from "./helpers";
import type { Action, AgentKey, AltConfig } from "../types";

interface ContentBlock {
  type: string;
  text?: string;
  input?: { query?: string };
  [key: string]: unknown;
}

interface AnthropicResponse {
  content?: ContentBlock[];
  stop_reason?: string;
}

// Wrap a system prompt with cache_control so Anthropic caches it between calls.
// Cached tokens don't count against TPM limits — critical for staying under 30K TPM.
const sys = (text: string) => [{ type: "text" as const, text, cache_control: { type: "ephemeral" as const } }];
const DEBUG_AGENT_CONTEXT = String(import.meta.env.VITE_DEBUG_AGENT_CONTEXT || "").toLowerCase() === "true";

let lastRateLimitAt = 0;

const markRateLimited = (err: unknown): void => {
  const e = err as Error & { status?: number };
  if (e?.status === 429) lastRateLimitAt = Date.now();
};

// Keep continuation context compact to avoid TPM spikes on follow-up calls.
const textOnly = (content: ContentBlock[] | undefined, maxBlocks = 3, maxChars = 900): ContentBlock[] =>
  (content || [])
    .filter((b) => b.type === "text")
    .slice(0, maxBlocks)
    .map((b) => ({ ...b, text: (b.text || "").slice(0, maxChars) }));

const logAgentContext = (
  agentName: string,
  model: string,
  round: "initial" | "continue_1" | "continue_2",
  payload: Record<string, unknown>
): void => {
  if (!DEBUG_AGENT_CONTEXT) return;
  console.log(`[Atlas AI][ctx] ${agentName} (${model}) ${round}`, payload);
};

const getAgentMaxTokens = (agentName: string): number => {
  switch (agentName) {
    case "cost":
      return 1200;
    case "arch":
      return 1600;
    case "ops":
      return 1600;
    case "strategy":
      return 1200;
    case "evaluator":
      return 900;
    default:
      return 1200;
  }
};

const AGENTS_WITH_TOOLS: AgentKey[] = ["cost", "arch", "ops", "strategy"];

const agentUsesTools = (agentName: string): boolean =>
  AGENTS_WITH_TOOLS.includes(agentName as AgentKey);

/** Web-search tool with cache_control so tool definitions are cached (same as system). */
const WEB_SEARCH_TOOLS = [
  { type: "web_search_20250305" as const, name: "web_search" as const, cache_control: { type: "ephemeral" as const } },
];

export async function callAgent(
  systemPrompt: string,
  userMessage: string,
  dispatch: (action: Action) => void,
  agentName: string,
  apiKey: string,
  model = "claude-haiku-4-5-20251001"
): Promise<Record<string, unknown>> {
  const inputTokens = estimateTokens(systemPrompt + userMessage);
  console.log(`[Atlas AI] Agent started: ${agentName} | ~${inputTokens} input tokens`);
  await ensureTokenBudget(inputTokens);
  dispatch({ type: "UPDATE_AGENT", agent: agentName as AgentKey, status: "searching" });
  const maxRetries = 4;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const initialPayload: Record<string, unknown> = {
        model,
        max_tokens: getAgentMaxTokens(agentName),
        cache_control: { type: "ephemeral" },
        system: sys(systemPrompt),
        messages: [{ role: "user", content: userMessage }],
      };
      if (agentUsesTools(agentName)) {
        initialPayload.tools = WEB_SEARCH_TOOLS;
      }
      logAgentContext(agentName, model, "initial", initialPayload);
      await ensureTokenBudget(estimateTokens(JSON.stringify(initialPayload)));
      const res = await fetch(getApiUrl(apiKey), {
        method: "POST",
        headers: getApiHeaders(apiKey),
        body: JSON.stringify(initialPayload),
      });
      const data = await parseApiResponse(res) as AnthropicResponse;

      // Extract search queries for log
      (data.content || []).forEach((b) => {
        if (b.type === "tool_use" && b.input?.query) {
          dispatch({ type: "ADD_SEARCH", value: { agent: agentName, query: b.input.query, ts: Date.now() } });
        }
      });

      // If model wants more tool calls, continue
      let finalData = data;
      if (data.stop_reason === "tool_use") {
        dispatch({ type: "UPDATE_AGENT", agent: agentName as AgentKey, status: "analyzing" });
        const contPayload: Record<string, unknown> = {
          model,
          max_tokens: getAgentMaxTokens(agentName),
          cache_control: { type: "ephemeral" },
          system: sys(systemPrompt),
          messages: [
            { role: "user", content: userMessage },
            { role: "assistant", content: textOnly(data.content) },
            { role: "user", content: "You have done enough research. Now produce ONLY the final JSON based on everything you found. No markdown, no backticks." },
          ],
        };
        if (agentUsesTools(agentName)) {
          contPayload.tools = WEB_SEARCH_TOOLS;
        }
        logAgentContext(agentName, model, "continue_1", contPayload);
        await ensureTokenBudget(estimateTokens(JSON.stringify(contPayload)));
        const cont = await fetch(getApiUrl(apiKey), {
          method: "POST",
          headers: getApiHeaders(apiKey),
          body: JSON.stringify(contPayload),
        });
        finalData = await parseApiResponse(cont) as AnthropicResponse;
        (finalData.content || []).forEach((b) => {
          if (b.type === "tool_use" && b.input?.query) {
            dispatch({ type: "ADD_SEARCH", value: { agent: agentName, query: b.input.query, ts: Date.now() } });
          }
        });

        // Third round if still doing tool use
        if (finalData.stop_reason === "tool_use") {
          const cont2Payload: Record<string, unknown> = {
            model,
            max_tokens: getAgentMaxTokens(agentName),
            cache_control: { type: "ephemeral" },
            system: sys(systemPrompt),
            messages: [
              { role: "user", content: userMessage },
              { role: "assistant", content: textOnly(data.content) },
              { role: "user", content: "Continue." },
              { role: "assistant", content: textOnly(finalData.content) },
              { role: "user", content: "STOP SEARCHING. Output ONLY the JSON now." },
            ],
          };
          logAgentContext(agentName, model, "continue_2", cont2Payload);
          await ensureTokenBudget(estimateTokens(JSON.stringify(cont2Payload)));
          const cont2 = await fetch(getApiUrl(apiKey), {
            method: "POST",
            headers: getApiHeaders(apiKey),
            body: JSON.stringify(cont2Payload),
          });
          finalData = await parseApiResponse(cont2) as AnthropicResponse;
        }
      }

      const text = (finalData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      dispatch({ type: "UPDATE_AGENT", agent: agentName as AgentKey, status: "done" });
      console.log("[Atlas AI] Agent done:", agentName);
      try { return JSON.parse(clean) as Record<string, unknown>; } catch { return { raw: clean, error: "parse_failed" }; }
    } catch (e) {
      markRateLimited(e);
      const retry = attempt < maxRetries && isRetriableError(e);
      if (retry) {
        const delay = retryDelayMs(e, attempt);
        const err = e as Error & { status?: number };
        console.warn(`[Atlas AI] Agent ${agentName} attempt ${attempt}/${maxRetries} failed (status=${err?.status}), retrying in ${delay}ms...`, err?.message ?? e);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      const err = e as Error;
      console.error(`[Atlas AI] Agent ${agentName} failed:`, err?.message ?? e, err?.stack ?? "");
      dispatch({ type: "UPDATE_AGENT", agent: agentName as AgentKey, status: "error" });
      return { error: err.message };
    }
  }
  return { error: "unknown" };
}

/**
 * Distill all 5 agent outputs into 3 bullet points each using Haiku.
 * Produces a compact, semantically-meaningful summary for the evaluator —
 * far better quality than mechanical string truncation (slimPayload).
 * Falls back to slimPayload if the Haiku call fails.
 */
export async function distillAgents(
  agentResults: Record<string, unknown>,
  apiKey: string
): Promise<Record<string, unknown>> {
  console.log("[Atlas AI] Distilling agent outputs for evaluator...");
  // Pre-slim before sending to Haiku to avoid sending full raw agent JSONs
  const slim = slimPayload(agentResults, { maxStr: 220, maxArr: 3 }) as Record<string, unknown>;
  // Avoid extra API calls while still within a likely rate-limit cooldown window.
  if (Date.now() - lastRateLimitAt < 90000) {
    console.log("[Atlas AI] Distiller skipped due to recent rate-limit; using slimPayload fallback.");
    return slim;
  }
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const approxTokens = estimateTokens(JSON.stringify(slim));
      await ensureTokenBudget(approxTokens);
      const res = await fetch(getApiUrl(apiKey), {
        method: "POST",
        headers: getApiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          cache_control: { type: "ephemeral" },
          system: sys("You distill technical analyses into concise key findings. Return ONLY valid JSON, no markdown."),
          messages: [{
            role: "user",
            content: `Summarize each section of this tech decision analysis into exactly 3 concise key findings.
Return ONLY valid JSON with this exact shape (no other text):
{ "cost": ["finding1","finding2","finding3"], "architecture": [...], "operations": [...], "strategy": [...] }

Analysis:
${JSON.stringify(slim)}`,
          }],
        }),
      });
      const data = await parseApiResponse(res) as AnthropicResponse;
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      console.log(`[Atlas AI] Distiller done: ~${estimateTokens(clean)} tokens output`);
      return JSON.parse(clean) as Record<string, unknown>;
    } catch (e) {
      markRateLimited(e);
      const retry = attempt < maxRetries && isRetriableError(e);
      const err = e as Error & { status?: number };
      if (retry) {
        const delay = retryDelayMs(e, attempt);
        console.warn(`[Atlas AI] Distiller attempt ${attempt}/${maxRetries} failed (status=${err?.status}), retrying in ${delay}ms...`, err?.message ?? e);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.warn("[Atlas AI] Distiller failed, falling back to slimPayload:", err?.message);
      return slim;
    }
  }
  return slim;
}

// altConfig = AltConfig | null
export async function callSynthesis(
  systemPrompt: string,
  agentResults: Record<string, unknown>,
  dispatch: (action: Action) => void,
  apiKey: string,
  altConfig: AltConfig | null = null
): Promise<Record<string, unknown>> {
  console.log("[Atlas AI] Synthesis started", altConfig ? `(${altConfig.provider}/${altConfig.model})` : "(Anthropic)");
  dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "working" });
  const userContent = "Here are the specialist agent outputs. Synthesize into a single executive brief.\n\n" + JSON.stringify(agentResults);
  console.log(`[Atlas AI] Synthesis input: ~${estimateTokens(userContent)} tokens (payload ${userContent.length} chars)`);
  const maxRetries = altConfig ? 2 : 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let clean: string;
      if (altConfig) {
        const endpoint = getAltEndpoint(altConfig.provider) ?? "";
        clean = (await callOpenAICompat(systemPrompt, userContent, { endpoint, model: altConfig.model, apiKey: altConfig.apiKey, maxTokens: 2000 }))
          .replace(/```json|```/g, "")
          .trim();
      } else {
        await ensureTokenBudget(estimateTokens(systemPrompt + userContent));
        const res = await fetch(getApiUrl(apiKey), {
          method: "POST",
          headers: getApiHeaders(apiKey),
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            cache_control: { type: "ephemeral" },
            system: sys(systemPrompt),
            messages: [{ role: "user", content: userContent }],
          }),
        });
        const data = await parseApiResponse(res) as AnthropicResponse;
        const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
        clean = text.replace(/```json|```/g, "").trim();
      }
      dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "done" });
      console.log("[Atlas AI] Synthesis done");
      return JSON.parse(clean) as Record<string, unknown>;
    } catch (e) {
      markRateLimited(e);
      const retry = attempt < maxRetries && isRetriableError(e);
      const err = e as Error & { status?: number };
      if (retry) {
        const delay = retryDelayMs(e, attempt);
        console.warn(`[Atlas AI] Synthesis attempt ${attempt}/${maxRetries} failed (status=${err?.status}), retrying in ${delay}ms...`, err?.message ?? e);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error("[Atlas AI] Synthesis failed:", err?.message ?? e, err?.stack ?? "");
      dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "error" });
      throw e;
    }
  }
  throw new Error("Synthesis failed after retries");
}
