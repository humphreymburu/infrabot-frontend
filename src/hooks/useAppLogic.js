import { useState, useRef, useCallback, useEffect, useReducer } from "react";
import { reducer, initialState } from "../store/reducer";
import { PROVIDERS, getEnvKeyForProvider, getAltEndpoint } from "../api/config";
import { callOpenAICompat, runWithConcurrency, slimPayload, estimateTokens } from "../api/helpers";
import { callAgent, callSynthesis, distillAgents } from "../api/agents";
import {
  COST_AGENT_PROMPT, ARCH_AGENT_PROMPT, OPERATIONS_AGENT_PROMPT,
  STRATEGY_AGENT_PROMPT, EVALUATOR_PROMPT, SYNTHESIS_PROMPT,
} from "../lib/prompts";
import { AGENT_PROMPTS, AGENT_BRIEF_KEYS } from "../lib/constants";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

export function useAppLogic() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [altProvider, setAltProvider] = useState(() => {
    try { return localStorage.getItem("tda-alt-provider") || import.meta.env.VITE_ALT_PROVIDER || ""; }
    catch { return import.meta.env.VITE_ALT_PROVIDER || ""; }
  });

  const [altModel, setAltModel] = useState(() => {
    try { return localStorage.getItem("tda-alt-model") || import.meta.env.VITE_ALT_MODEL || ""; }
    catch { return import.meta.env.VITE_ALT_MODEL || ""; }
  });

  const [altApiKey, setAltApiKey] = useState(() => {
    try {
      return localStorage.getItem("tda-alt-api-key") ||
        getEnvKeyForProvider(localStorage.getItem("tda-alt-provider") || import.meta.env.VITE_ALT_PROVIDER || "");
    } catch { return ""; }
  });

  const [showMoreExamples, setShowMoreExamples] = useState(false);
  const resultRef = useRef(null);
  // Workspace isolation: each analysis run gets a unique ID. dispatch calls from
  // stale runs are dropped so a second analysis never corrupts the first run's state.
  const runId = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem("tda-alt-api-key", altApiKey);
      localStorage.setItem("tda-alt-provider", altProvider);
      localStorage.setItem("tda-alt-model", altModel);
    } catch {}
  }, [altApiKey, altProvider, altModel]);

  // Global error reporter
  useEffect(() => {
    window.__reportError = (msg) => dispatch({ type: "SET_ERROR", value: msg || "Something went wrong." });
    return () => { delete window.__reportError; };
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tda-brief-history");
      if (stored) {
        JSON.parse(stored).forEach((h) => dispatch({ type: "ADD_HISTORY", value: h }));
      }
    } catch {}
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (state.history.length > 0) {
      try { localStorage.setItem("tda-brief-history", JSON.stringify(state.history)); } catch {}
    }
  }, [state.history]);

  const effectiveAltModel = altModel || (altProvider ? PROVIDERS[altProvider]?.defaultModel : "") || "";
  const altConfig = altApiKey && altProvider ? { provider: altProvider, model: effectiveAltModel, apiKey: altApiKey } : null;

  const getMainInput = useCallback(() => {
    const ctx = state.context;
    const main = (state.input || "").trim();
    const guided = [ctx.guidedStep1, ctx.guidedStep2, ctx.guidedStep3].filter(Boolean).join("\n\n").trim();
    if (main && guided) return main + "\n\n" + guided;
    return main || guided;
  }, [state.context, state.input]);

  const buildUserMessage = useCallback(() => {
    const ctx = state.context;
    let msg = getMainInput();
    if (ctx.budget) msg += `\n\nMonthly budget constraint: ${ctx.budget}`;
    if (ctx.teamSize) msg += `\nTeam: ${ctx.teamSize}`;
    if (ctx.timeline) msg += `\nTimeline: ${ctx.timeline} months`;
    if (ctx.cloud) msg += `\nPrimary cloud: ${ctx.cloud}`;
    if (ctx.riskAppetite) msg += `\nRisk appetite: ${ctx.riskAppetite}`;
    if (ctx.compliance.length) msg += `\nCompliance: ${ctx.compliance.join(", ")}`;
    if (ctx.uploadedData) msg += `\n\nAttached document (${ctx.uploadedData.name}):\n${ctx.uploadedData.content.slice(0, 5000)}`;

    const sc = state.scenarioOverrides;
    if (sc.trafficMultiplier && sc.trafficMultiplier !== "1x") msg += `\n\nSCENARIO: Assume ${sc.trafficMultiplier} current traffic load.`;
    if (sc.timelineChange && sc.timelineChange !== "no_change") msg += `\nSCENARIO: Timeline change — ${sc.timelineChange}.`;
    if (sc.teamChange && sc.teamChange !== "none") msg += `\nSCENARIO: Team change — ${sc.teamChange}.`;
    if (sc.addCompliance && sc.addCompliance !== "none") msg += `\nSCENARIO: Add ${sc.addCompliance} compliance requirement.`;
    return msg;
  }, [getMainInput, state.context, state.scenarioOverrides]);

  const analyze = useCallback(async (text) => {
    const query = text || getMainInput();
    if (!query.trim()) return;
    if (text) dispatch({ type: "SET_INPUT", value: text });

    const thisRun = ++runId.current;
    // Gate all dispatches: if a newer run starts, stale callbacks become no-ops
    const safe = (action) => { if (runId.current === thisRun) dispatch(action); };

    console.log("[Atlas AI] Analysis started");
    safe({ type: "SET_PHASE", value: "researching" });
    safe({ type: "CLEAR_SEARCHES" });
    safe({ type: "RESET_AGENTS" });
    safe({ type: "SET_TAB", value: "brief" });

    let userMsg = text ? text : buildUserMessage();

    // Item 4: inject prior analysis context if a similar brief exists in history.
    // Simple word-overlap match on title — cheap and effective for re-visits.
    const queryWords = userMsg.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const similar = state.history.find((h) => {
      const title = (h.meta?.title || "").toLowerCase();
      return queryWords.some((w) => title.includes(w));
    });
    if (similar) {
      userMsg += `\n\nPRIOR CONTEXT: A related analysis exists — "${similar.meta?.title}" (Verdict: ${similar.meta?.verdict}, Confidence: ${similar.meta?.confidence_score}/10). Summary: ${(similar.meta?.executive_summary || "").slice(0, 300)}`;
    }

    try {
      // PHASE 1: 4 specialist agents (concurrency 2) — ops covers both SRE + DevOps
      console.log("[Atlas AI] Phase 1: specialist agents — concurrency 2");
      const [costResult, archResult, opsResult, strategyResult] = await runWithConcurrency([
        () => callAgent(COST_AGENT_PROMPT, userMsg, safe, "cost", apiKey),
        () => callAgent(ARCH_AGENT_PROMPT, userMsg, safe, "arch", apiKey),
        () => callAgent(OPERATIONS_AGENT_PROMPT, userMsg, safe, "ops", apiKey),
        () => callAgent(STRATEGY_AGENT_PROMPT, userMsg, safe, "strategy", apiKey),
      ], 2);
      console.log("[Atlas AI] Phase 1: done");

      // PHASE 2: Devil's Advocate evaluator
      console.log("[Atlas AI] Phase 2: Critical Review", altConfig ? `→ ${altConfig.provider}/${altConfig.model}` : "→ Anthropic");
      safe({ type: "SET_PHASE", value: "evaluating" });
      // Drop failed agents so parse errors don't poison the evaluator
      let prelimBrief = {
        cost:         costResult?.error  ? null : costResult,
        architecture: archResult?.error  ? null : archResult,
        operations:   opsResult?.error   ? null : opsResult,
        strategy:     strategyResult?.error ? null : strategyResult,
      };
      let evalResult;

      // Item 3: semantic distillation via Haiku instead of mechanical string truncation
      const distilled = await distillAgents(prelimBrief, apiKey);
      const evalInput = `Review this preliminary tech decision brief and find weaknesses:\n\n${JSON.stringify(distilled)}`;
      console.log(`[Atlas AI] Evaluator input: ~${estimateTokens(evalInput)} tokens`);

      if (altConfig) {
        safe({ type: "UPDATE_AGENT", agent: "evaluator", status: "searching" });
        try {
          const endpoint = getAltEndpoint(altConfig.provider);
          const raw = await callOpenAICompat(EVALUATOR_PROMPT, evalInput, { endpoint, model: altConfig.model, apiKey: altConfig.apiKey });
          evalResult = JSON.parse(raw.replace(/```json|```/g, "").trim());
          safe({ type: "UPDATE_AGENT", agent: "evaluator", status: "done" });
        } catch (e) {
          console.warn("[Atlas AI] Alt evaluator failed, falling back to Anthropic:", e?.message);
          safe({ type: "UPDATE_AGENT", agent: "evaluator", status: "error" });
          evalResult = await callAgent(EVALUATOR_PROMPT, evalInput, safe, "evaluator", apiKey, "claude-sonnet-4-6");
        }
      } else {
        evalResult = await callAgent(EVALUATOR_PROMPT, evalInput, safe, "evaluator", apiKey, "claude-sonnet-4-6");
      }
      console.log("[Atlas AI] Phase 2: done");

      // PHASE 2.5: Optimizer — re-run flagged agents; surface critiques in UI
      const toRevise = Object.entries(evalResult?.revision_needed || {}).filter(([, reason]) => reason);
      if (toRevise.length > 0) {
        console.log(`[Atlas AI] Phase 2.5: Optimizer — revising ${toRevise.length} agent(s):`, toRevise.map(([k]) => k).join(", "));
        safe({ type: "SET_PHASE", value: "revising" });
        safe({ type: "SET_EVAL_CRITIQUES", value: toRevise });
        for (const [agentKey, critique] of toRevise) {
          const prompt = AGENT_PROMPTS[agentKey];
          if (!prompt) continue;
          const revisedMsg = `${userMsg}\n\nCRITICAL FEEDBACK FROM REVIEWER — you MUST address this in your revised analysis:\n${critique}`;
          const revisedResult = await callAgent(prompt, revisedMsg, safe, agentKey, apiKey);
          if (!revisedResult?.error) {
            prelimBrief = { ...prelimBrief, [AGENT_BRIEF_KEYS[agentKey]]: revisedResult };
          }
        }
        console.log("[Atlas AI] Phase 2.5: done");
      }

      // PHASE 3: Synthesis — slim all results before sending to Sonnet
      console.log("[Atlas AI] Phase 3: synthesis", altConfig ? `→ ${altConfig.provider}/${altConfig.model}` : "→ Anthropic");
      safe({ type: "SET_PHASE", value: "synthesizing" });
      const allResults = slimPayload({ ...prelimBrief, devils_advocate: evalResult });
      console.log(`[Atlas AI] Synthesis payload: ~${estimateTokens(JSON.stringify(allResults))} tokens`);
      const finalBrief = await callSynthesis(SYNTHESIS_PROMPT, allResults, safe, apiKey, altConfig);
      console.log("[Atlas AI] Phase 3: done");

      finalBrief._timestamp = new Date().toISOString();
      finalBrief.devils_advocate = evalResult;

      safe({ type: "SET_BRIEF", value: finalBrief });
      safe({ type: "ADD_HISTORY", value: finalBrief });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      console.log("[Atlas AI] Analysis complete");
    } catch (e) {
      console.error("[Atlas AI] Analysis failed:", e?.message ?? e, e?.stack ?? "");
      safe({ type: "SET_ERROR", value: `Analysis failed: ${e?.message ?? String(e)}. Please try again.` });
    }
  }, [getMainInput, buildUserMessage, apiKey, altConfig]);

  const handleScenarioReanalyze = useCallback(() => {
    // Do NOT pass buildUserMessage() as text — that would write the expanded
    // string back to state.input and cause constraints to be appended again
    // on the next run. analyze() calls buildUserMessage() internally instead.
    analyze();
  }, [analyze]);

  const handleLoadHistory = useCallback((h) => {
    dispatch({ type: "SET_BRIEF", value: h });
    dispatch({ type: "SET_TAB", value: "brief" });
  }, []);

  return {
    state,
    dispatch,
    apiKey,
    altProvider,
    setAltProvider,
    altModel,
    setAltModel,
    altApiKey,
    setAltApiKey,
    effectiveAltModel,
    altConfig,
    showMoreExamples,
    setShowMoreExamples,
    resultRef,
    getMainInput,
    analyze,
    handleScenarioReanalyze,
    handleLoadHistory,
  };
}
