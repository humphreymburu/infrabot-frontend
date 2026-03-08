import { useState, useRef, useCallback, useEffect, useReducer } from "react";
import { reducer, initialState } from "../store/reducer";
import { PROVIDERS, getEnvKeyForProvider } from "../api/config";
import type { Action, AltConfig, AgentKey, AgentStatus, AppPhase, Brief, PolicyPreview } from "../types";

type ErrorReportingWindow = Window & { __reportError?: (msg: string) => void };

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
const tenantId = import.meta.env.VITE_TENANT_ID || "local-dev";

export function useAppLogic() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const activeAbort = useRef<AbortController | null>(null);

  const [altProvider, setAltProvider] = useState<string>(() => {
    try { return localStorage.getItem("tda-alt-provider") || import.meta.env.VITE_ALT_PROVIDER || ""; }
    catch { return import.meta.env.VITE_ALT_PROVIDER || ""; }
  });

  const [altModel, setAltModel] = useState<string>(() => {
    try { return localStorage.getItem("tda-alt-model") || import.meta.env.VITE_ALT_MODEL || ""; }
    catch { return import.meta.env.VITE_ALT_MODEL || ""; }
  });

  const [altApiKey, setAltApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("tda-alt-api-key") ||
        getEnvKeyForProvider(localStorage.getItem("tda-alt-provider") || import.meta.env.VITE_ALT_PROVIDER || "");
    } catch { return ""; }
  });

  const [showMoreExamples, setShowMoreExamples] = useState(false);
  const [policyPreview, setPolicyPreview] = useState<PolicyPreview | null>(null);
  const [policyPreviewLoading, setPolicyPreviewLoading] = useState(false);
  const [latestRunId, setLatestRunId] = useState<string>("");
  const resultRef = useRef<HTMLDivElement | null>(null);
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
    const w = window as ErrorReportingWindow;
    w.__reportError = (msg) => dispatch({ type: "SET_ERROR", value: msg || "Something went wrong." });
    return () => {
      delete w.__reportError;
    };
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tda-brief-history");
      if (stored) {
        (JSON.parse(stored) as Brief[]).forEach((h) => dispatch({ type: "ADD_HISTORY", value: h }));
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
  const altConfig: AltConfig | null = altApiKey && altProvider ? { provider: altProvider, model: effectiveAltModel, apiKey: altApiKey } : null;

  const getMainInput = useCallback((): string => {
    const ctx = state.context;
    const main = (state.input || "").trim();
    const guided = [ctx.guidedStep1, ctx.guidedStep2, ctx.guidedStep3].filter(Boolean).join("\n\n").trim();
    if (main && guided) return main + "\n\n" + guided;
    return main || guided;
  }, [state.context, state.input]);

  const buildUserMessage = useCallback((): string => {
    const ctx = state.context;
    let msg = getMainInput();
    if (ctx.budget) msg += `\n\nMonthly budget constraint: ${ctx.budget}`;
    if (ctx.teamSize) msg += `\nTeam: ${ctx.teamSize}`;
    if (ctx.timeline) msg += `\nTimeline: ${ctx.timeline} months`;
    if (ctx.cloud) msg += `\nPrimary cloud: ${ctx.cloud}`;
    if (ctx.riskAppetite) msg += `\nRisk appetite: ${ctx.riskAppetite}`;
    if (ctx.compliance.length) msg += `\nCompliance: ${ctx.compliance.join(", ")}`;
    if (ctx.uploadedData) msg += `\n\nAttached document (${ctx.uploadedData.name}):\n${ctx.uploadedData.content.slice(0, 2000)}`;

    const sc = state.scenarioOverrides;
    if (sc.trafficMultiplier && sc.trafficMultiplier !== "1x") msg += `\n\nSCENARIO: Assume ${sc.trafficMultiplier} current traffic load.`;
    if (sc.timelineChange && sc.timelineChange !== "no_change") msg += `\nSCENARIO: Timeline change — ${sc.timelineChange}.`;
    if (sc.teamChange && sc.teamChange !== "none") msg += `\nSCENARIO: Team change — ${sc.teamChange}.`;
    if (sc.addCompliance && sc.addCompliance !== "none") msg += `\nSCENARIO: Add ${sc.addCompliance} compliance requirement.`;
    return msg;
  }, [getMainInput, state.context, state.scenarioOverrides]);

  const previewPolicy = useCallback(async (text?: string): Promise<void> => {
    const userMsg = text ?? buildUserMessage();
    if (!userMsg.trim()) {
      setPolicyPreview(null);
      return;
    }
    const intakePayload = {
      budget: state.context.budget || undefined,
      timeline: state.context.timeline || undefined,
      risk_appetite: state.context.riskAppetite || undefined,
      compliance: state.context.compliance.length ? state.context.compliance : undefined,
    };
    setPolicyPreviewLoading(true);
    try {
      const previewRes = await fetch("/api/policy-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          user_message: userMsg,
          ...intakePayload,
        }),
      });
      if (!previewRes.ok) return;
      const preview = (await previewRes.json()) as PolicyPreview;
      setPolicyPreview(preview);
    } catch {
      // Non-fatal; preview should not block analysis UX.
    } finally {
      setPolicyPreviewLoading(false);
    }
  }, [buildUserMessage, state.context]);

  const analyze = useCallback(async (text?: string): Promise<void> => {
    const query = text || getMainInput();
    if (!query.trim()) return;
    if (text) dispatch({ type: "SET_INPUT", value: text });

    activeAbort.current?.abort();
    const controller = new AbortController();
    activeAbort.current = controller;

    const thisRun = ++runId.current;
    const safe = (action: Action) => { if (runId.current === thisRun) dispatch(action); };

    console.log("[Atlas AI] Analysis started (backend)");
    setPolicyPreview(null);
    safe({ type: "SET_ERROR", value: null });
    safe({ type: "SET_PHASE", value: "researching" });
    safe({ type: "CLEAR_SEARCHES" });
    safe({ type: "RESET_AGENTS" });
    safe({ type: "SET_TAB", value: "brief" });

    let userMsg = text ?? buildUserMessage();
    const intakePayload = {
      budget: state.context.budget || undefined,
      timeline: state.context.timeline || undefined,
      risk_appetite: state.context.riskAppetite || undefined,
      compliance: state.context.compliance.length ? state.context.compliance : undefined,
    };

    // Inject prior analysis context if a similar brief exists in history
    const queryWords = userMsg.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const similar = state.history.find((h) => {
      const title = (h.meta?.title || "").toLowerCase();
      return queryWords.some((w) => title.includes(w));
    });
    const priorContext = similar
      ? `A related analysis exists — "${similar.meta?.title}" (Verdict: ${similar.meta?.verdict}, Confidence: ${similar.meta?.confidence_score}/10). Summary: ${(similar.meta?.executive_summary || "").slice(0, 300)}`
      : null;

    try {
      await previewPolicy(userMsg);

      const res = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        signal: controller.signal,
        body: JSON.stringify({
          user_message: userMsg,
          prior_context: priorContext ?? undefined,
          ...intakePayload,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = Array.isArray(body.detail) ? body.detail.map((o: { msg?: string }) => o?.msg).filter(Boolean).join("; ") : body.detail;
        throw new Error(String(detail ?? res.statusText));
      }
      const backendRunId = res.headers.get("x-run-id");
      if (backendRunId) {
        setLatestRunId(backendRunId);
        console.log(`[Atlas AI] Backend stream connected run_id=${backendRunId}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming response not available in this environment");
      const decoder = new TextDecoder();
      let buf = "";
      let gotFinal = false;

      const handleEvent = (ev: Record<string, unknown>) => {
        const t = String(ev.type || "");
        if (t === "phase") {
          if (ev.run_id) console.log(`[Atlas AI] Stream event run_id=${String(ev.run_id)} phase=${String(ev.phase || "")}`);
          const phase = String(ev.phase || "") as AppPhase;
          if (phase) safe({ type: "SET_PHASE", value: phase });
          return;
        }
        if (t === "agent") {
          const agent = String(ev.agent || "") as AgentKey;
          const status = String(ev.status || "") as AgentStatus;
          if (agent && status) safe({ type: "UPDATE_AGENT", agent, status });
          return;
        }
        if (t === "agent_error_detail") {
          console.error(
            `[Atlas AI] Agent failure run_id=${String(ev.run_id || "")} agent=${String(ev.agent || "")} provider=${String(ev.provider || "")} model=${String(ev.model || "")} error=${String(ev.error || "")} detail=${String(ev.detail || "")}`,
          );
          return;
        }
        if (t === "eval_critiques") {
          const critiques = ev.critiques as [string, string][] | undefined;
          safe({ type: "SET_EVAL_CRITIQUES", value: critiques ?? null });
          return;
        }
        if (t === "search") {
          const agent = String(ev.agent || "agent");
          const query = String(ev.query || "");
          const tsRaw = ev.ts;
          const ts = typeof tsRaw === "string" ? Date.parse(tsRaw) : Date.now();
          if (query) safe({ type: "ADD_SEARCH", value: { agent, query, ts: Number.isFinite(ts) ? ts : Date.now() } });
          return;
        }
        if (t === "search_results") {
          console.info(
            `[Atlas AI] Grounded search run_id=${String(ev.run_id || "")} agent=${String(ev.agent || "")} provider=${String(ev.provider || "")} count=${String(ev.count || 0)}`,
            ev.results,
          );
          return;
        }
        if (t === "final") {
          const brief = ev.brief as Brief | undefined;
          if (!brief) throw new Error("Missing final brief");
          const finalBrief = { ...brief, _timestamp: new Date().toISOString(), _run_id: String(ev.run_id || latestRunId || "") } as Brief;
          safe({ type: "SET_BRIEF", value: finalBrief });
          safe({ type: "ADD_HISTORY", value: finalBrief });
          safe({ type: "SET_PHASE", value: "done" });
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
          console.log("[Atlas AI] Analysis complete");
          gotFinal = true;
          return;
        }
        if (t === "error") {
          const detail = String(ev.detail || "Analysis failed");
          throw new Error(detail);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        while (true) {
          const idx = buf.indexOf("\n");
          if (idx < 0) break;
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line) as Record<string, unknown>;
          } catch (err) {
            // ignore malformed lines but keep the stream running
            console.warn("[Atlas AI] Bad stream line:", line, err);
            continue;
          }
          handleEvent(ev);
        }
      }
      if (!gotFinal) throw new Error("Stream ended before final brief was produced");
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") return;
      console.error("[Atlas AI] Analysis failed:", err?.message ?? e, err?.stack ?? "");
      safe({ type: "SET_ERROR", value: `Analysis failed: ${err?.message ?? String(e)}. Please try again.` });
    }
  }, [getMainInput, buildUserMessage, state.history, state.context, previewPolicy]);

  const handleScenarioReanalyze = useCallback(() => {
    // Do NOT pass buildUserMessage() as text — that would write the expanded
    // string back to state.input and cause constraints to be appended again
    // on the next run. analyze() calls buildUserMessage() internally instead.
    analyze();
  }, [analyze]);

  const handleLoadHistory = useCallback((h: Brief) => {
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
    policyPreview,
    policyPreviewLoading,
    latestRunId,
    resultRef,
    getMainInput,
    previewPolicy,
    analyze,
    handleScenarioReanalyze,
    handleLoadHistory,
  };
}
