import { T, S } from "./lib/theme";
import { PROVIDERS, getEnvKeyForProvider } from "./api/config";
import { SCENARIOS } from "./lib/constants";
import { useAppLogic } from "./hooks/useAppLogic";
import { IntakeForm } from "./components/IntakeForm";
import { AgentProgress } from "./components/AgentProgress";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { BriefView } from "./components/BriefView";
import { DevilsView } from "./components/DevilsView";
import { SourcesView } from "./components/SourcesView";
import { HistoryView } from "./components/HistoryView";
import { DiffView } from "./components/DiffView";
import { Tab } from "./components/ui/Badge";

export default function App() {
  const {
    state, dispatch,
    apiKey, altProvider, setAltProvider, setAltModel, altApiKey, setAltApiKey,
    effectiveAltModel, showMoreExamples, setShowMoreExamples,
    resultRef, getMainInput, analyze, handleScenarioReanalyze, handleLoadHistory,
  } = useAppLogic();

  const handleCompare = (h) => {
    dispatch({ type: "SET_COMPARE", value: h });
    dispatch({ type: "SET_TAB", value: "changes" });
  };

  const isAnalyzing = ["researching", "evaluating", "revising", "synthesizing"].includes(state.phase);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t, fontFamily: T.sn }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
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
                <div style={{ fontSize: 13, color: T.m, marginTop: 2, fontFamily: T.sn }}>Enterprise AI Architecture Analysis</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: T.sn, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: T.d }}>Anthropic</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiKey ? T.g : T.rd }} title={apiKey ? "Key configured" : "Set VITE_ANTHROPIC_API_KEY in .env"} />
                <span style={{ fontSize: 11, color: apiKey ? T.d : T.rd }}>{apiKey ? "Connected" : "Missing — set VITE_ANTHROPIC_API_KEY"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: T.d }}>Reasoning</span>
                <select
                  value={altProvider}
                  onChange={(e) => { setAltProvider(e.target.value); setAltApiKey(getEnvKeyForProvider(e.target.value)); setAltModel(""); }}
                  style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 4, padding: "2px 6px", fontFamily: T.sn }}
                >
                  <option value="">Claude Sonnet</option>
                  {Object.entries(PROVIDERS).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
                </select>
                {altProvider && (
                  <select
                    value={effectiveAltModel}
                    onChange={(e) => setAltModel(e.target.value)}
                    style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 4, padding: "2px 6px", fontFamily: T.sn }}
                  >
                    {PROVIDERS[altProvider].models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                {altProvider && (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: altApiKey ? T.g : T.o }} />
                    {!altApiKey && (
                      <input
                        type="password"
                        placeholder={`${PROVIDERS[altProvider]?.name} API key`}
                        value={altApiKey}
                        onChange={(e) => setAltApiKey(e.target.value)}
                        style={{ fontSize: 11, background: T.s, color: T.t, border: `1px solid ${T.b}`, borderRadius: 4, padding: "2px 8px", width: 160, fontFamily: T.sn }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: S.s, display: "flex", gap: S.s, flexWrap: "wrap" }}>
            {["Parallel Agents", "Critical Review", "Scenario Modeling", "Cost Forecasting", "Migration Planner"].map((t) => (
              <span key={t} style={{ fontSize: 11, fontFamily: T.sn, fontWeight: 500, color: T.a, padding: "4px 10px", background: T.aD, border: `1px solid ${T.aB}`, borderRadius: 999 }}>{t}</span>
            ))}
          </div>
        </header>

        <div data-noprint style={{ marginBottom: S.s }}>
          <span style={{ fontSize: 11, fontFamily: T.sn, color: T.d, letterSpacing: "0.08em", textTransform: "uppercase" }}>Decision workspace</span>
        </div>

        {/* INTAKE + EXAMPLES */}
        <div data-noprint style={{ display: "flex", gap: S.l, alignItems: "flex-start", flexWrap: "wrap", marginBottom: S.l }}>
          <div style={{ flex: "3 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: S.m }}>
            <IntakeForm state={state} dispatch={dispatch} />
            {(state.phase === "idle" || isAnalyzing) && (
              <div style={{ position: "sticky", bottom: 0, paddingTop: S.m, background: `linear-gradient(to top, ${T.bg} 80%, transparent)` }}>
                <button
                  type="button"
                  onClick={() => state.phase === "idle" && getMainInput().trim() && analyze()}
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
                  {state.phase === "idle" ? "Analyze Architecture Decision" : "Analyzing\u2026"}
                </button>
                <p style={{ fontSize: 11, color: T.d, margin: `${S.s}px 0 0`, fontFamily: T.sn, textAlign: "center" }}>
                  {isAnalyzing ? "This usually takes 1\u20132 minutes" : getMainInput().trim() ? "5 AI agents \u00b7 Cost modeling \u00b7 Risk analysis" : "Enter a decision prompt above to analyze"}
                </p>
              </div>
            )}
          </div>

          {state.phase === "idle" && (
            <aside style={{ flex: "2 1 260px", minWidth: 260 }}>
              <div style={{ fontSize: 11, fontFamily: T.sn, color: T.m, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: S.s }}>Example Decisions</div>
              <div style={{ fontSize: 12, color: T.m, margin: "0 0 10px", fontFamily: T.sn }}>Not sure where to start? Try one of these.</div>
              <div style={{ display: "grid", gap: S.s }}>
                {(showMoreExamples ? SCENARIOS : SCENARIOS.slice(0, 2)).map((ex, i) => (
                  <button key={i} onClick={() => analyze(ex.text)}
                    style={{ display: "block", background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: `${S.m}px ${S.l}px`, cursor: "pointer", textAlign: "left", width: "100%", boxShadow: "0 2px 6px rgba(15,23,42,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.a; e.currentTarget.style.background = T.r; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.b; e.currentTarget.style.background = T.s; }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.t, fontFamily: T.sn, display: "block", marginBottom: 4 }}>{ex.label}</span>
                    <span style={{ fontSize: 12, color: T.m, lineHeight: 1.5, fontFamily: T.sn }}>{ex.text.slice(0, 100)}\u2026</span>
                    <span style={{ fontSize: 11, color: T.a, marginTop: 6, display: "block" }}>Run scenario \u2192</span>
                  </button>
                ))}
              </div>
              {SCENARIOS.length > 2 && (
                <button type="button" onClick={() => setShowMoreExamples(!showMoreExamples)}
                  style={{ marginTop: S.s, fontSize: 12, color: T.a, background: "none", border: "none", cursor: "pointer", fontFamily: T.sn, padding: 0 }}>
                  {showMoreExamples ? "Show less" : "More examples \u2192"}
                </button>
              )}
            </aside>
          )}
        </div>

        {/* PROGRESS */}
        {isAnalyzing && (
          <div style={{ marginBottom: S.l }}>
            <div role="status" aria-live="polite" style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l, marginBottom: S.m, boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t, marginBottom: S.s, fontFamily: T.sn }}>AI Analysis</div>
              <p style={{ fontSize: 12, color: T.m, margin: `0 0 ${S.m}px`, fontFamily: T.sn }}>
                {state.phase === "researching" ? "Researching architecture options\u2026 Evaluating cost tradeoffs\u2026"
                  : state.phase === "evaluating" ? "Critical review in progress\u2026"
                  : state.phase === "revising" ? "Optimizer: re-running flagged agents with reviewer feedback\u2026"
                  : "Synthesizing brief\u2026"} This usually takes 1\u20133 minutes.
              </p>
              {[
                { done: true, active: false, label: "Parsing context" },
                { done: ["evaluating", "revising", "synthesizing"].includes(state.phase), active: state.phase === "researching", label: "Specialist agents (cost · arch · operations · strategy)" },
                { done: ["revising", "synthesizing"].includes(state.phase), active: state.phase === "evaluating", label: "Devil's Advocate review" },
                {
                  done: state.phase === "synthesizing",
                  active: state.phase === "revising",
                  label: state.evalCritiques?.length
                    ? `Optimizer: revising ${state.evalCritiques.map(([k]) => k).join(", ")} — ${state.evalCritiques[0]?.[1]?.slice(0, 70)}…`
                    : "Optimizer: revising flagged domains",
                },
                { done: false, active: state.phase === "synthesizing", label: "Synthesis" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: S.s, padding: `${S.s}px 0`, fontSize: 13, color: step.done ? T.m : T.t, fontFamily: T.sn }}>
                  <span style={{ width: 20, textAlign: "center" }}>
                    {step.done ? <span style={{ color: T.g }}>\u2713</span> : step.active ? <span style={{ color: T.a, animation: "pulse 1s infinite" }}>\u2192</span> : "\u25cb"}
                  </span>
                  <span>{step.label}{step.active ? "\u2026" : ""}</span>
                </div>
              ))}
            </div>
            <AgentProgress progress={state.agentProgress} searchLog={state.searchLog} />
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
        {state.brief && (
          <div ref={resultRef}>
            <div data-noprint style={{ display: "flex", gap: S.s, marginBottom: S.m, flexWrap: "wrap" }}>
              <Tab active={state.activeTab === "brief"} label="Decision Brief" onClick={() => dispatch({ type: "SET_TAB", value: "brief" })} />
              <Tab active={state.activeTab === "devils"} label="Critical Review" onClick={() => dispatch({ type: "SET_TAB", value: "devils" })} />
              <Tab active={state.activeTab === "sources"} label="Sources" onClick={() => dispatch({ type: "SET_TAB", value: "sources" })} count={state.searchLog.length} />
              <Tab active={state.activeTab === "scenarios"} label="Scenarios" onClick={() => dispatch({ type: "SET_TAB", value: "scenarios" })} />
              <Tab active={state.activeTab === "history"} label="History" onClick={() => dispatch({ type: "SET_TAB", value: "history" })} count={state.history.length} />
              {(state.compareWith || state.history.length >= 2) && (
                <Tab active={state.activeTab === "changes"} label="What Changed" onClick={() => dispatch({ type: "SET_TAB", value: "changes" })} />
              )}
              <button onClick={() => window.print()} style={{ marginLeft: "auto", background: "#FFFFFF", border: `1px solid ${T.b}`, borderRadius: 999, padding: "6px 14px", fontSize: 11, fontFamily: T.sn, fontWeight: 500, color: T.m, cursor: "pointer" }}>
                Export to PDF
              </button>
            </div>
            {state.activeTab === "brief" && <BriefView d={state.brief} />}
            {state.activeTab === "devils" && <DevilsView d={state.brief} />}
            {state.activeTab === "sources" && <SourcesView d={state.brief} searchLog={state.searchLog} />}
            {state.activeTab === "scenarios" && <ScenarioPanel state={state} dispatch={dispatch} onReanalyze={handleScenarioReanalyze} />}
            {state.activeTab === "history" && <HistoryView history={state.history} onLoad={handleLoadHistory} onCompare={handleCompare} currentBrief={state.brief} />}
            {state.activeTab === "changes" && <DiffView current={state.history[0] ?? state.brief} previous={state.compareWith ?? state.history[1]} />}
          </div>
        )}
      </div>
    </div>
  );
}
