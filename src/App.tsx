import { T, S } from "./lib/theme";
import { PROVIDERS, getEnvKeyForProvider } from "./api/config";
import { SCENARIOS, type Scenario } from "./lib/constants.ts";
import { useAppLogic } from "./hooks/useAppLogic";
import { IntakeForm } from "./components/IntakeForm";
import { NanobotWorkflowView } from "./components/NanobotWorkflowView";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { BriefView } from "./components/BriefView";
import { DevilsView } from "./components/DevilsView";
import { SourcesView } from "./components/SourcesView";
import { HistoryView } from "./components/HistoryView";
import { DiffView } from "./components/DiffView";
import { RunMetadataView } from "./components/RunMetadataView";
import { TraceReplayView } from "./components/TraceReplayView";
import { TraceDiffView } from "./components/TraceDiffView";
import { ReviewQueueView } from "./components/ReviewQueueView";
import { EvidenceInspectorView } from "./components/EvidenceInspectorView";
import { LineageExplorerView } from "./components/LineageExplorerView";
import { TelemetryDashboardView } from "./components/TelemetryDashboardView";
import { PolicySimulatorView } from "./components/PolicySimulatorView";
import { Tab } from "./components/ui/Badge";
import type { Brief } from "./types";
import { useEffect, useState } from "react";

export default function App() {
  const showAdvancedUi = String(import.meta.env.VITE_ENABLE_ADVANCED_UI || "").toLowerCase() === "true";
  const [showRuntimeDrawer, setShowRuntimeDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const {
    state, dispatch,
    altProvider, setAltProvider, setAltModel, altApiKey, setAltApiKey,
    effectiveAltModel, showMoreExamples, setShowMoreExamples, policyPreview, policyPreviewLoading, latestRunId,
    resultRef, getMainInput, previewPolicy, analyze, handleScenarioReanalyze, handleLoadHistory,
  } = useAppLogic();

  const handleCompare = (h: Brief) => {
    dispatch({ type: "SET_COMPARE", value: h });
    dispatch({ type: "SET_TAB", value: "changes" });
  };

  const isAnalyzing = ["researching", "evaluating", "revising", "synthesizing"].includes(state.phase);
  const canGoStep2 = isAnalyzing || Boolean(state.workflowGraph);
  const canGoStep3 = Boolean(state.brief);

  useEffect(() => {
    if (isAnalyzing) setCurrentStep(2);
    else if (state.brief) setCurrentStep(3);
  }, [isAnalyzing, state.brief]);

  const startAnalysis = (text?: string) => {
    const candidate = text ?? getMainInput();
    if (!candidate.trim() || state.phase !== "idle") return;
    setCurrentStep(2);
    void analyze(text);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t, fontFamily: T.sn }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        @keyframes briefIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
        *{box-sizing:border-box}
        ::placeholder{color:#4B5563;}
        button:focus,input:focus,select:focus,textarea:focus,a:focus{outline:none}
        button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid ${T.a};outline-offset:2px;}
        button:not(:disabled){transition:filter .15s ease,transform .1s ease,box-shadow .2s ease}
        button:not(:disabled):hover{filter:brightness(1.06)}
        button:not(:disabled):active{transform:scale(0.98)}
        input,select,textarea{transition:border-color .2s ease,box-shadow .2s ease}
        input:focus,select:focus,textarea:focus{border-color:${T.a};box-shadow:0 0 0 3px ${T.aD}}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:${T.bg}} ::-webkit-scrollbar-thumb{background:${T.b};border-radius:3px}
        table{font-family:${T.sn}}
        @media print{body{background:#fff!important;color:#000!important} [data-noprint]{display:none!important}}
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: `${S.xl}px ${S.l}px ${S.xxl}px` }}>

        {/* HEADER */}
        <header data-noprint style={{ marginBottom: S.m, padding: S.l, borderRadius: 16, border: `1px solid ${T.b}`, background: T.s, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: S.m }}>
            <div style={{ display: "flex", alignItems: "center", gap: S.s }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${T.a}, #6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#FFF" }}>⬡</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.t, fontFamily: T.sn }}>Infrabot</div>
                <div style={{ fontSize: 13, color: T.m, marginTop: 2, fontFamily: T.sn }}>Agentic Decision Orchestrator</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: T.sn, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: T.d }}>Backend runtime</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.a }} title="Server-routed provider stack" />
                <span style={{ fontSize: 11, color: T.d }}>Server-routed models</span>
              </div>
              {showAdvancedUi && (
                <button
                  type="button"
                  onClick={() => setShowRuntimeDrawer((v) => !v)}
                  style={{ fontSize: 11, border: `1px solid ${T.b}`, background: T.s, color: T.t, borderRadius: 999, padding: "5px 10px", cursor: "pointer", fontFamily: T.sn }}
                >
                  Runtime Settings
                </button>
              )}
            </div>
          </div>
          {showAdvancedUi && showRuntimeDrawer && (
            <div style={{ marginTop: S.s, border: `1px solid ${T.b}`, borderRadius: 10, background: T.bg, padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.m }}>Reasoning:</span>
              <select
                value={altProvider}
                onChange={(e) => { setAltProvider(e.target.value); setAltApiKey(getEnvKeyForProvider(e.target.value)); setAltModel(""); }}
                style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", fontFamily: T.sn }}
              >
                <option value="">Claude Sonnet</option>
                {Object.entries(PROVIDERS).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
              </select>
              {altProvider && (
                <select
                  value={effectiveAltModel}
                  onChange={(e) => setAltModel(e.target.value)}
                  style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", fontFamily: T.sn }}
                >
                  {PROVIDERS[altProvider].models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              {altProvider && !altApiKey && (
                <input
                  type="password"
                  placeholder={`${PROVIDERS[altProvider]?.name} API key`}
                  value={altApiKey}
                  onChange={(e) => setAltApiKey(e.target.value)}
                  style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", width: 180, fontFamily: T.sn }}
                />
              )}
            </div>
          )}
        </header>

        <div data-noprint style={{ marginBottom: S.s }}>
          <span style={{ fontSize: 11, fontFamily: T.sn, color: T.d, letterSpacing: "0.08em", textTransform: "uppercase" }}>Decision workspace</span>
        </div>
        <div data-noprint style={{ display: "flex", gap: 8, marginBottom: S.l, flexWrap: "wrap" }}>
          {[
            { id: 1 as const, label: "Step 1 · Intake", enabled: true },
            { id: 2 as const, label: "Step 2 · Live Orchestration", enabled: canGoStep2 },
            { id: 3 as const, label: "Step 3 · Results & Governance", enabled: canGoStep3 },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => s.enabled && setCurrentStep(s.id)}
              disabled={!s.enabled}
              style={{
                fontSize: 12,
                border: `1px solid ${currentStep === s.id ? T.aB : T.b}`,
                background: currentStep === s.id ? T.aD : T.s,
                color: currentStep === s.id ? T.a : (s.enabled ? T.t : T.d),
                borderRadius: 999,
                padding: "6px 12px",
                cursor: s.enabled ? "pointer" : "not-allowed",
                fontFamily: T.sn,
                fontWeight: 600,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* INTAKE + EXAMPLES */}
        {currentStep === 1 && (
        <div data-noprint style={{ display: "flex", gap: S.l, alignItems: "flex-start", flexWrap: "wrap", marginBottom: S.l }}>
          <div style={{ flex: "3 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: S.m }}>
            <IntakeForm state={state} dispatch={dispatch} />
            {(state.phase === "idle" || isAnalyzing) && (
              <div style={{ position: "sticky", bottom: 0, paddingTop: S.m, background: `linear-gradient(to top, ${T.bg} 80%, transparent)` }}>
                {!policyPreview && state.phase === "idle" && !!getMainInput().trim() && (
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      disabled={policyPreviewLoading}
                      onClick={() => previewPolicy()}
                      style={{
                        fontSize: 11,
                        border: `1px solid ${T.b}`,
                        background: T.s,
                        color: T.m,
                        borderRadius: 999,
                        padding: "4px 10px",
                        cursor: policyPreviewLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {policyPreviewLoading ? "Previewing..." : "Preview policy"}
                    </button>
                  </div>
                )}
                {policyPreview && (
                  <div style={{ marginBottom: 10, border: `1px solid ${T.b}`, background: T.s, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: T.d, textTransform: "uppercase", letterSpacing: "0.08em" }}>Selected policy</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: T.t, fontWeight: 600 }}>
                          {policyPreview.tier} • {policyPreview.path}
                        </span>
                        <button
                          type="button"
                          disabled={policyPreviewLoading || state.phase !== "idle"}
                          onClick={() => previewPolicy()}
                          style={{
                            fontSize: 11,
                            border: `1px solid ${T.b}`,
                            background: T.bg,
                            color: T.m,
                            borderRadius: 999,
                            padding: "3px 8px",
                            cursor: policyPreviewLoading || state.phase !== "idle" ? "not-allowed" : "pointer",
                          }}
                        >
                          {policyPreviewLoading ? "Refreshing..." : "Refresh policy"}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: T.m, marginTop: 4 }}>{policyPreview.selection_reason}</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => startAnalysis()}
                  disabled={state.phase !== "idle" || !getMainInput().trim()}
                  style={{
                    width: "100%", height: 52,
                    background: state.phase === "idle" && getMainInput().trim() ? T.a : "#E5E7EB",
                    color: state.phase === "idle" && getMainInput().trim() ? "#FFFFFF" : "#9CA3AF",
                    border: "none", borderRadius: 12, padding: `0 ${S.l}px`, fontSize: 16, fontWeight: 600,
                    cursor: state.phase === "idle" && getMainInput().trim() ? "pointer" : "not-allowed",
                    fontFamily: T.sn,
                    boxShadow: state.phase === "idle" && getMainInput().trim() ? "0 4px 14px rgba(79,70,229,0.4)" : "none",
                    transition: "background 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {state.phase === "idle" ? "Analyze Architecture Decision" : "Analyzing…"}
                </button>
                <p style={{ fontSize: 11, color: T.d, margin: `${S.s}px 0 0`, fontFamily: T.sn, textAlign: "center" }}>
                  {isAnalyzing ? "This usually takes 1–2 minutes" : getMainInput().trim() ? "5 AI agents · Cost modeling · Risk analysis" : "Enter a decision prompt above to analyze"}
                </p>
              </div>
            )}
          </div>

          {state.phase === "idle" && (
            <aside style={{ flex: "2 1 260px", minWidth: 260 }}>
              <div style={{ fontSize: 11, fontFamily: T.sn, color: T.m, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: S.s }}>Example Decisions</div>
              <div style={{ fontSize: 12, color: T.m, margin: "0 0 10px", fontFamily: T.sn }}>Not sure where to start? Try one of these.</div>
              <div style={{ display: "grid", gap: S.s }}>
                {(showMoreExamples ? SCENARIOS : SCENARIOS.slice(0, 2)).map((ex: Scenario, i: number) => (
                  <button key={i} onClick={() => startAnalysis(ex.text)}
                    style={{ display: "block", background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: `${S.m}px ${S.l}px`, cursor: "pointer", textAlign: "left", width: "100%", boxShadow: "0 2px 6px rgba(15,23,42,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.a; e.currentTarget.style.background = T.r; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.b; e.currentTarget.style.background = T.s; }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.t, fontFamily: T.sn, display: "block", marginBottom: 4 }}>{ex.label}</span>
                    <span style={{ fontSize: 12, color: T.m, lineHeight: 1.5, fontFamily: T.sn }}>{ex.text.slice(0, 100)}…</span>
                    <span style={{ fontSize: 11, color: T.a, marginTop: 6, display: "block" }}>Run scenario →</span>
                  </button>
                ))}
              </div>
              {SCENARIOS.length > 2 && (
                <button type="button" onClick={() => setShowMoreExamples(!showMoreExamples)}
                  style={{ marginTop: S.s, fontSize: 12, color: T.a, background: "none", border: "none", cursor: "pointer", fontFamily: T.sn, padding: 0 }}>
                  {showMoreExamples ? "Show less" : "More examples →"}
                </button>
              )}
            </aside>
          )}
        </div>
        )}

        {/* PROGRESS */}
        {currentStep === 2 && (
          <div style={{ marginBottom: S.l }}>
            {state.workflowGraph ? (
              <NanobotWorkflowView
                graph={state.workflowGraph}
                phaseLabel={
                  state.phase === "researching" ? "Researching options and cost tradeoffs"
                    : state.phase === "evaluating" ? "Critical evaluation in progress"
                      : state.phase === "revising" ? "Revision loop executing"
                        : state.phase === "done" ? "Execution complete"
                          : "Synthesizing final decision brief"
                }
                progress={state.agentProgress}
                searchLog={state.searchLog}
                sharedEvidence={state.sharedEvidence}
              />
            ) : (
              <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 18, color: T.m }}>
                Start an analysis in Step 1 to view live orchestration.
              </div>
            )}
            {state.brief && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  style={{ fontSize: 12, border: `1px solid ${T.aB}`, background: T.aD, color: T.a, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}
                >
                  Open Step 3 Results
                </button>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {state.error && (
          <div data-noprint role="alert" style={{ background: T.rD, border: "2px solid #DC2626", borderRadius: 12, padding: S.l, marginBottom: S.m }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.rd, margin: "0 0 8px", fontFamily: T.sn }}>Error</p>
            <p style={{ fontSize: 13, color: T.rd, margin: 0, fontFamily: T.sn }}>{state.error}</p>
            <button type="button" onClick={() => dispatch({ type: "SET_ERROR", value: null })} style={{ marginTop: 12, fontSize: 12, color: T.rd, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Dismiss</button>
          </div>
        )}

        {/* RESULTS */}
        {currentStep === 3 && state.brief && (
          <div ref={resultRef}>
            <div data-noprint style={{ display: "flex", gap: S.s, marginBottom: S.m, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: T.d, textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "center" }}>Decision</span>
              <Tab active={state.activeTab === "brief"} label="Decision Brief" onClick={() => dispatch({ type: "SET_TAB", value: "brief" })} />
              <Tab active={state.activeTab === "devils"} label="Critical Review" onClick={() => dispatch({ type: "SET_TAB", value: "devils" })} />
              <Tab active={state.activeTab === "sources"} label="Sources" onClick={() => dispatch({ type: "SET_TAB", value: "sources" })} count={state.searchLog.length} />
              <Tab active={state.activeTab === "history"} label="History" onClick={() => dispatch({ type: "SET_TAB", value: "history" })} count={state.history.length} />
              <span style={{ fontSize: 11, color: T.d, textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "center", marginLeft: 8 }}>Execution</span>
              {showAdvancedUi && (
                <Tab active={state.activeTab === "metadata"} label="Run Metadata" onClick={() => dispatch({ type: "SET_TAB", value: "metadata" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "evidence"} label="Evidence Inspector" onClick={() => dispatch({ type: "SET_TAB", value: "evidence" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "scenarios"} label="Scenarios" onClick={() => dispatch({ type: "SET_TAB", value: "scenarios" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "replay"} label="Trace Replay" onClick={() => dispatch({ type: "SET_TAB", value: "replay" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "rundiff"} label="Run Diff" onClick={() => dispatch({ type: "SET_TAB", value: "rundiff" })} />
              )}
              {state.workflowGraph && (
                <Tab active={state.activeTab === "workflow"} label="Workflow" onClick={() => dispatch({ type: "SET_TAB", value: "workflow" })} />
              )}
              <span style={{ fontSize: 11, color: T.d, textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "center", marginLeft: 8 }}>Governance</span>
              {showAdvancedUi && (
                <Tab active={state.activeTab === "reviews"} label="Review Queue" onClick={() => dispatch({ type: "SET_TAB", value: "reviews" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "lineage"} label="Lineage Explorer" onClick={() => dispatch({ type: "SET_TAB", value: "lineage" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "telemetry"} label="Telemetry" onClick={() => dispatch({ type: "SET_TAB", value: "telemetry" })} />
              )}
              {showAdvancedUi && (
                <Tab active={state.activeTab === "fleet"} label="Fleet Ops" onClick={() => dispatch({ type: "SET_TAB", value: "fleet" })} />
              )}
              <span style={{ fontSize: 11, color: T.d, textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "center", marginLeft: 8 }}>Debug</span>
              {showAdvancedUi && (
                <Tab active={state.activeTab === "simulator"} label="Policy Simulator" onClick={() => dispatch({ type: "SET_TAB", value: "simulator" })} />
              )}
              {showAdvancedUi && (state.compareWith || state.history.length >= 2) && (
                <Tab active={state.activeTab === "changes"} label="What Changed" onClick={() => dispatch({ type: "SET_TAB", value: "changes" })} />
              )}
              <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "#FFFFFF", border: `1px solid ${T.b}`, borderRadius: 999, padding: "6px 14px", fontSize: 11, fontFamily: T.sn, fontWeight: 500, color: T.m, cursor: "pointer" }}>
                Export to PDF
              </button>
            </div>
            {state.activeTab === "brief" && <BriefView d={state.brief} />}
            {state.activeTab === "devils" && <DevilsView d={state.brief} />}
            {state.activeTab === "sources" && (
              <SourcesView
                d={state.brief}
                searchLog={state.searchLog}
                searchResults={state.searchResults}
                sharedEvidence={state.sharedEvidence}
              />
            )}
            {showAdvancedUi && state.activeTab === "metadata" && <RunMetadataView d={state.brief} />}
            {showAdvancedUi && state.activeTab === "evidence" && <EvidenceInspectorView d={state.brief} />}
            {showAdvancedUi && state.activeTab === "scenarios" && <ScenarioPanel state={state} dispatch={dispatch} onReanalyze={handleScenarioReanalyze} />}
            {state.activeTab === "history" && <HistoryView history={state.history} onLoad={handleLoadHistory} onCompare={handleCompare} currentBrief={state.brief} />}
            {showAdvancedUi && state.activeTab === "replay" && <TraceReplayView initialRunId={latestRunId} />}
            {showAdvancedUi && state.activeTab === "rundiff" && <TraceDiffView defaultA={latestRunId} />}
            {showAdvancedUi && state.activeTab === "reviews" && <ReviewQueueView />}
            {showAdvancedUi && state.activeTab === "lineage" && <LineageExplorerView initialRunId={latestRunId} />}
            {showAdvancedUi && state.activeTab === "telemetry" && <TelemetryDashboardView mode="overview" />}
            {showAdvancedUi && state.activeTab === "fleet" && <TelemetryDashboardView mode="fleet" />}
            {showAdvancedUi && state.activeTab === "simulator" && <PolicySimulatorView />}
            {state.activeTab === "workflow" && (
              <NanobotWorkflowView
                graph={state.workflowGraph}
                phaseLabel="Workflow replay"
                progress={state.agentProgress}
                searchLog={state.searchLog}
                sharedEvidence={state.sharedEvidence}
              />
            )}
            {showAdvancedUi && state.activeTab === "changes" && <DiffView current={state.history[0] ?? state.brief} previous={state.compareWith ?? state.history[1]} />}
          </div>
        )}
      </div>
    </div>
  );
}
