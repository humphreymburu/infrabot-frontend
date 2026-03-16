import { useState, useRef, useCallback, useEffect, useReducer } from "react";
import { reducer, initialState } from "../store/reducer";
import { PROVIDERS, getEnvKeyForProvider } from "../api/config";
import type {
  Action, AltConfig, AgentKey, AgentStatus, AppPhase, Brief, PolicyPreview,
  SharedEvidenceItem, WorkflowEdge, WorkflowNode, WorkflowNodeStatus,
} from "../types";

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
    safe({ type: "RESET_WORKFLOW_GRAPH" });
    safe({ type: "RESET_SHARED_EVIDENCE" });
    safe({ type: "SET_TAB", value: "brief" });

    let userMsg = text ?? buildUserMessage();
    let featureInventory: Record<string, unknown> | undefined;
    let benchmarkReport: Record<string, unknown> | undefined;
    let currentStackConfig: Record<string, unknown> | undefined;
    let proposedStackConfig: Record<string, unknown> | undefined;
    let workloadAssumptions: Record<string, unknown> | undefined;
    const parseArtifactJson = (raw: string | undefined): void => {
      if (!raw || !raw.trim()) return;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.features)) featureInventory = parsed;
          if (Array.isArray(parsed.runs)) benchmarkReport = parsed;
          if (parsed.feature_inventory && typeof parsed.feature_inventory === "object") {
            featureInventory = parsed.feature_inventory as Record<string, unknown>;
          }
          if (parsed.benchmark_report && typeof parsed.benchmark_report === "object") {
            benchmarkReport = parsed.benchmark_report as Record<string, unknown>;
          }
          if (parsed.current_stack_config && typeof parsed.current_stack_config === "object") {
            currentStackConfig = parsed.current_stack_config as Record<string, unknown>;
          }
          if (parsed.proposed_stack_config && typeof parsed.proposed_stack_config === "object") {
            proposedStackConfig = parsed.proposed_stack_config as Record<string, unknown>;
          }
          if (parsed.workload_assumptions && typeof parsed.workload_assumptions === "object") {
            workloadAssumptions = parsed.workload_assumptions as Record<string, unknown>;
          }
        }
      } catch {
        // Ignore non-JSON artifact content.
      }
    };
    parseArtifactJson(state.context.featureInventoryData?.content);
    parseArtifactJson(state.context.benchmarkReportData?.content);
    parseArtifactJson(state.context.uploadedData?.content);
    const intakePayload = {
      budget: state.context.budget || undefined,
      timeline: state.context.timeline || undefined,
      risk_appetite: state.context.riskAppetite || undefined,
      compliance: state.context.compliance.length ? state.context.compliance : undefined,
      feature_inventory: featureInventory,
      benchmark_report: benchmarkReport,
      current_stack_config: (() => {
        const fromForm: Record<string, unknown> = {
          instance_type: state.context.currentInstanceType || undefined,
          node_count: state.context.currentNodeCount || undefined,
          storage_gb: state.context.currentStorageGb || undefined,
          region: state.context.currentRegion || undefined,
        };
        const merged = { ...(currentStackConfig || {}), ...fromForm };
        return Object.values(merged).some((v) => String(v ?? "").trim().length > 0) ? merged : undefined;
      })(),
      proposed_stack_config: (() => {
        const fromForm: Record<string, unknown> = {
          tier: state.context.proposedTier || undefined,
          search_units: state.context.proposedSearchUnits || undefined,
          storage_gb: state.context.proposedStorageGb || undefined,
          region: state.context.proposedRegion || undefined,
        };
        const merged = { ...(proposedStackConfig || {}), ...fromForm };
        return Object.values(merged).some((v) => String(v ?? "").trim().length > 0) ? merged : undefined;
      })(),
      workload_assumptions: (() => {
        const fromForm: Record<string, unknown> = {
          doc_count: state.context.workloadDocCount || undefined,
          qps: state.context.workloadQps || undefined,
          growth_3y_multiplier: state.context.workloadGrowth3yMultiplier || undefined,
        };
        const merged = { ...(workloadAssumptions || {}), ...fromForm };
        return Object.values(merged).some((v) => String(v ?? "").trim().length > 0) ? merged : undefined;
      })(),
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
      // Keep policy preview asynchronous so analysis start is not blocked by preview latency.
      void previewPolicy(userMsg);

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
        const detail = body?.detail;
        if (Array.isArray(detail)) {
          const msg = detail.map((o: { msg?: string }) => o?.msg).filter(Boolean).join("; ");
          throw new Error(msg || res.statusText);
        }
        if (detail && typeof detail === "object") {
          const code = String((detail as { code?: unknown }).code || "").trim();
          const msg = String((detail as { message?: unknown }).message || "").trim();
          const missing = Array.isArray((detail as { missing_fields?: unknown }).missing_fields)
            ? ((detail as { missing_fields: unknown[] }).missing_fields.map((x) => String(x)).filter(Boolean))
            : [];
          const pretty = [msg || code || "Request validation failed", missing.length ? `Missing: ${missing.join(", ")}` : ""]
            .filter(Boolean)
            .join(" — ");
          throw new Error(pretty || res.statusText);
        }
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
        if (t === "workflow_graph") {
          const nodes = Array.isArray(ev.nodes) ? (ev.nodes as WorkflowNode[]) : [];
          const edges = Array.isArray(ev.edges) ? (ev.edges as WorkflowEdge[]) : [];
          const stateMap = (ev.state && typeof ev.state === "object") ? (ev.state as Record<string, WorkflowNodeStatus>) : {};
          safe({ type: "SET_WORKFLOW_GRAPH", value: { nodes, edges, state: stateMap, runtime: {} } });
          return;
        }
        if (t === "workflow_node") {
          const nodeId = String(ev.node_id || "");
          const status = String(ev.status || "") as WorkflowNodeStatus;
          const durationRaw = ev.duration_ms;
          const durationMs = typeof durationRaw === "number" ? durationRaw : undefined;
          const reason = typeof ev.reason === "string" ? ev.reason : undefined;
          const ts = typeof ev.ts === "string" ? ev.ts : undefined;
          if (nodeId && status) safe({ type: "UPDATE_WORKFLOW_NODE", nodeId, status, durationMs, reason, ts });
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
          console.log(
            `[Atlas AI] Web research query run_id=${String(ev.run_id || "")} agent=${agent} query=${query}`,
          );
          return;
        }
        if (t === "search_results") {
          const agent = String(ev.agent || "agent");
          const provider = String(ev.provider || "");
          const tsRaw = ev.ts;
          const ts = typeof tsRaw === "string" ? Date.parse(tsRaw) : Date.now();
          const results = Array.isArray(ev.results)
            ? (ev.results as Array<Record<string, unknown>>).map((r) => ({
                title: String(r?.title || "").trim(),
                url: String(r?.url || "").trim(),
              }))
            : [];
          if (results.length > 0) {
            safe({
              type: "ADD_SEARCH_RESULTS",
              value: {
                agent,
                provider: provider || undefined,
                results,
                ts: Number.isFinite(ts) ? ts : Date.now(),
              },
            });
          }
          console.log(
            `[Atlas AI] Web research results run_id=${String(ev.run_id || "")} agent=${String(ev.agent || "")} provider=${String(ev.provider || "")} count=${String(ev.count || 0)}`,
            ev.results,
          );
          return;
        }
        if (t === "shared_evidence_index") {
          const globalSearchPreview = Array.isArray(ev.global_search_preview)
            ? (ev.global_search_preview as Array<{ title?: string; url?: string }>)
            : [];
          const byAgent = Array.isArray(ev.by_agent) ? (ev.by_agent as SharedEvidenceItem[]) : [];
          safe({ type: "SET_SHARED_EVIDENCE", value: { globalSearchPreview, byAgent } });
          console.log(
            `[Atlas AI] Shared web research index run_id=${String(ev.run_id || "")} global=${globalSearchPreview.length} agents=${byAgent.length}`,
            { globalSearchPreview, byAgent },
          );
          return;
        }
        if (t === "policy_selected") {
          console.info(
            `[Atlas AI] Policy selected run_id=${String(ev.run_id || "")} tier=${String(ev.tier || "")} path=${String(ev.path || "")} mode=${String(ev.mode || "")}`,
          );
          return;
        }
        if (t === "review_required") {
          console.warn(
            `[Atlas AI] Review required run_id=${String(ev.run_id || "")} review_id=${String(ev.review_id || "")} stage=${String(ev.stage || "")} reason=${String(ev.reason || "")}`,
          );
          return;
        }
        if (t === "review_decision") {
          console.info(
            `[Atlas AI] Review decision run_id=${String(ev.run_id || "")} review_id=${String(ev.review_id || "")} stage=${String(ev.stage || "")} action=${String(ev.action || "")}`,
          );
          return;
        }
        if (t === "quality_gate") {
          console.warn(
            `[Atlas AI] Quality gate run_id=${String(ev.run_id || "")} stage=${String(ev.stage || "")} cycle=${String(ev.cycle || "")}`,
            ev.gaps,
          );
          return;
        }
        if (t === "guarantee_violation") {
          console.warn(
            `[Atlas AI] Guarantee violation run_id=${String(ev.run_id || "")}`,
            ev.violations,
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
