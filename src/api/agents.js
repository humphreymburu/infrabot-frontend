import { getApiUrl, getApiHeaders, getAltEndpoint } from "./config";
import { parseApiResponse, isRetriableError, retryDelayMs, callOpenAICompat, estimateTokens, slimPayload } from "./helpers";

// Wrap a system prompt with cache_control so Anthropic caches it between calls.
// Cached tokens don't count against TPM limits — critical for staying under 30K TPM.
const sys = (text) => [{ type: "text", text, cache_control: { type: "ephemeral" } }];

// Strip tool_use/tool_result blocks from assistant history before sending as continuation
// input. Search result payloads can be thousands of tokens — keeping only the model's
// text reasoning cuts round-2/3 input by ~40% while preserving all synthesis context.
const textOnly = (content) => (content || []).filter((b) => b.type === "text");

export async function callAgent(systemPrompt, userMessage, dispatch, agentName, apiKey, model = "claude-haiku-4-5-20251001") {
  const inputTokens = estimateTokens(systemPrompt + userMessage);
  console.log(`[Atlas AI] Agent started: ${agentName} | ~${inputTokens} input tokens`);
  dispatch({ type: "UPDATE_AGENT", agent: agentName, status: "searching" });
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(getApiUrl(apiKey), {
        method: "POST",
        headers: getApiHeaders(apiKey),
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          system: sys(systemPrompt),
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await parseApiResponse(res);

      // Extract search queries for log
      (data.content || []).forEach((b) => {
        if (b.type === "tool_use" && b.input?.query) {
          dispatch({ type: "ADD_SEARCH", value: { agent: agentName, query: b.input.query, ts: Date.now() } });
        }
      });

      // If model wants more tool calls, continue
      let finalData = data;
      if (data.stop_reason === "tool_use") {
        dispatch({ type: "UPDATE_AGENT", agent: agentName, status: "analyzing" });
        const cont = await fetch(getApiUrl(apiKey), {
          method: "POST",
          headers: getApiHeaders(apiKey),
          body: JSON.stringify({
            model,
            max_tokens: 8000,
            system: sys(systemPrompt),
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages: [
              { role: "user", content: userMessage },
              { role: "assistant", content: textOnly(data.content) },
              { role: "user", content: "You have done enough research. Now produce ONLY the final JSON based on everything you found. No markdown, no backticks." },
            ],
          }),
        });
        finalData = await parseApiResponse(cont);
        (finalData.content || []).forEach((b) => {
          if (b.type === "tool_use" && b.input?.query) {
            dispatch({ type: "ADD_SEARCH", value: { agent: agentName, query: b.input.query, ts: Date.now() } });
          }
        });

        // Third round if still doing tool use
        if (finalData.stop_reason === "tool_use") {
          const cont2 = await fetch(getApiUrl(apiKey), {
            method: "POST",
            headers: getApiHeaders(apiKey),
            body: JSON.stringify({
              model,
              max_tokens: 8000,
              system: sys(systemPrompt),
              messages: [
                { role: "user", content: userMessage },
                { role: "assistant", content: textOnly(data.content) },
                { role: "user", content: "Continue." },
                { role: "assistant", content: textOnly(finalData.content) },
                { role: "user", content: "STOP SEARCHING. Output ONLY the JSON now." },
              ],
            }),
          });
          finalData = await parseApiResponse(cont2);
        }
      }

      const text = (finalData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      dispatch({ type: "UPDATE_AGENT", agent: agentName, status: "done" });
      console.log("[Atlas AI] Agent done:", agentName);
      try { return JSON.parse(clean); } catch { return { raw: clean, error: "parse_failed" }; }
    } catch (e) {
      const retry = attempt < maxRetries && isRetriableError(e);
      if (retry) {
        const delay = retryDelayMs(e, attempt);
        console.warn(`[Atlas AI] Agent ${agentName} attempt ${attempt} failed (status=${e?.status}), retrying in ${delay}ms...`, e?.message ?? e);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error(`[Atlas AI] Agent ${agentName} failed:`, e?.message ?? e, e?.stack ?? "");
      dispatch({ type: "UPDATE_AGENT", agent: agentName, status: "error" });
      return { error: e.message };
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
export async function distillAgents(agentResults, apiKey) {
  console.log("[Atlas AI] Distilling agent outputs for evaluator...");
  // Pre-slim before sending to Haiku to avoid sending full raw agent JSONs
  const slim = slimPayload(agentResults, { maxStr: 600, maxArr: 5 });
  try {
    const res = await fetch(getApiUrl(apiKey), {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: sys("You distill technical analyses into concise key findings. Return ONLY valid JSON, no markdown."),
        messages: [{
          role: "user",
          content: `Summarize each section of this tech decision analysis into exactly 3 concise key findings.
Return ONLY valid JSON with this exact shape (no other text):
{ "cost": ["finding1","finding2","finding3"], "architecture": [...], "sre": [...], "devops": [...], "strategy": [...] }

Analysis:
${JSON.stringify(slim)}`,
        }],
      }),
    });
    const data = await parseApiResponse(res);
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    console.log(`[Atlas AI] Distiller done: ~${estimateTokens(clean)} tokens output`);
    return JSON.parse(clean);
  } catch (e) {
    console.warn("[Atlas AI] Distiller failed, falling back to slimPayload:", e?.message);
    return slim;
  }
}

// altConfig = { provider, model, apiKey } | null
export async function callSynthesis(systemPrompt, agentResults, dispatch, apiKey, altConfig = null) {
  console.log("[Atlas AI] Synthesis started", altConfig ? `(${altConfig.provider}/${altConfig.model})` : "(Anthropic)");
  dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "working" });
  const userContent = "Here are the specialist agent outputs. Synthesize into a single executive brief.\n\n" + JSON.stringify(agentResults);
  console.log(`[Atlas AI] Synthesis input: ~${estimateTokens(userContent)} tokens (payload ${userContent.length} chars)`);
  try {
    let clean;
    if (altConfig) {
      const endpoint = getAltEndpoint(altConfig.provider);
      clean = (await callOpenAICompat(systemPrompt, userContent, { endpoint, model: altConfig.model, apiKey: altConfig.apiKey }))
        .replace(/```json|```/g, "")
        .trim();
    } else {
      const res = await fetch(getApiUrl(apiKey), {
        method: "POST",
        headers: getApiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          system: sys(systemPrompt),
          messages: [{ role: "user", content: userContent }],
        }),
      });
      const data = await parseApiResponse(res);
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      clean = text.replace(/```json|```/g, "").trim();
    }
    dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "done" });
    console.log("[Atlas AI] Synthesis done");
    return JSON.parse(clean);
  } catch (e) {
    console.error("[Atlas AI] Synthesis failed:", e?.message ?? e, e?.stack ?? "");
    dispatch({ type: "UPDATE_AGENT", agent: "synthesis", status: "error" });
    throw e;
  }
}
