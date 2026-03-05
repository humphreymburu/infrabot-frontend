import { T, S } from "../lib/theme";
import { MODULES } from "../lib/constants";
import type { AppState, Action, AppContext } from "../types";
import { Dispatch } from "react";

interface IntakeFormProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export function IntakeForm({ state, dispatch }: IntakeFormProps) {
  const ctx = state.context;
  const setCtx = (v: Partial<AppContext>) => dispatch({ type: "SET_CONTEXT", value: v });
  const setExpanded = (id: string) => dispatch({ type: "SET_EXPANDED_MODULE", value: state.expandedModule === id ? null : id });
  const complianceOpts = ["SOC 2", "HIPAA", "PCI-DSS", "GDPR", "FedRAMP", "ISO 27001", "SOX"];
  const toggleCompliance = (c: string) => {
    const arr = ctx.compliance.includes(c) ? ctx.compliance.filter((x) => x !== c) : [...ctx.compliance, c];
    setCtx({ compliance: arr });
  };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCtx({ uploadedData: { name: file.name, content: ev.target?.result as string } });
    reader.readAsText(file);
  };
  const lineCount = (state.input.match(/\n/g) || []).length + 1;
  const textareaRows = Math.min(8, Math.max(3, lineCount));

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l, boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
      <label htmlFor="decision-prompt" style={{ fontSize: 12, fontWeight: 600, color: T.t, display: "block", marginBottom: S.s, fontFamily: T.sn }}>
        What decision are you trying to make?
      </label>
      <textarea
        id="decision-prompt"
        aria-label="Describe your architecture decision"
        value={state.input}
        onChange={(e) => dispatch({ type: "SET_INPUT", value: e.target.value })}
        placeholder='e.g. "Should we migrate from OpenSearch to Azure AI Search to enable semantic search across 5000 documents?"'
        rows={textareaRows}
        style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 10, padding: S.m, fontSize: 14, color: T.t, resize: "vertical", fontFamily: T.sn, lineHeight: 1.6, marginBottom: S.s }}
      />
      <p style={{ fontSize: 11, color: T.d, margin: "0 0 " + S.m, fontFamily: T.sn }}>
        ✔ Architecture · Cost · Reliability · Migration · Lock-in · Critical review
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: S.s, marginBottom: S.s }}>
        {MODULES.map(({ id, label, key }) => (
          <div key={id}>
            <button
              type="button"
              onClick={() => setExpanded(id)}
              aria-expanded={state.expandedModule === id}
              style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                background: state.expandedModule === id ? T.aD : "transparent",
                border: `1px dashed ${state.expandedModule === id ? T.aB : T.b}`,
                borderRadius: 8, padding: "8px 10px", fontSize: 12, color: T.m,
                cursor: "pointer", fontFamily: T.sn, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, color: T.a }}>+</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              {id === "currentArch" && ctx.guidedStep1 && <span style={{ color: T.g, fontSize: 10 }}>✓</span>}
              {id === "proposed" && ctx.guidedStep2 && <span style={{ color: T.g, fontSize: 10 }}>✓</span>}
              {id === "constraints" && (ctx.guidedStep3 || ctx.budget) && <span style={{ color: T.g, fontSize: 10 }}>✓</span>}
              {id === "upload" && ctx.uploadedData && <span style={{ color: T.g, fontSize: 10 }}>✓</span>}
            </button>
          </div>
        ))}
      </div>

      {MODULES.map(({ id, key, placeholder }) => (
        state.expandedModule === id && (
          <div key={id} style={{ marginTop: S.s, paddingLeft: S.m, borderLeft: `3px solid ${T.aB}`, marginBottom: S.m }}>
            {key && (
              <textarea
                value={ctx[key]}
                onChange={(e) => setCtx({ [key]: e.target.value } as Partial<AppContext>)}
                placeholder={placeholder ?? ""}
                rows={3}
                style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 8, padding: S.m, fontSize: 13, color: T.t, resize: "vertical", fontFamily: T.sn, lineHeight: 1.5 }}
              />
            )}
            {id === "constraints" && (
              <div style={{ display: "flex", gap: S.m, flexWrap: "wrap", marginTop: S.s }}>
                <div style={{ flex: "1 1 100px" }}>
                  <label htmlFor="intake-budget" style={{ fontSize: 11, color: T.m, display: "block", marginBottom: 4 }}>Budget</label>
                  <input id="intake-budget" value={ctx.budget} onChange={(e) => setCtx({ budget: e.target.value })} placeholder="$15k/mo" style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: T.t }} />
                </div>
                <div style={{ flex: "1 1 70px" }}>
                  <label htmlFor="intake-timeline" style={{ fontSize: 11, color: T.m, display: "block", marginBottom: 4 }}>Timeline</label>
                  <input id="intake-timeline" type="number" value={ctx.timeline} onChange={(e) => setCtx({ timeline: e.target.value })} placeholder="12" style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: T.t }} />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label htmlFor="intake-risk" style={{ fontSize: 11, color: T.m, display: "block", marginBottom: 4 }}>Risk</label>
                  <select id="intake-risk" value={ctx.riskAppetite} onChange={(e) => setCtx({ riskAppetite: e.target.value })} style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: T.t }}>
                    {["conservative", "moderate", "aggressive"].map((o) => (
                      <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: "100%" }}>
                  <label style={{ fontSize: 11, color: T.m, display: "block", marginBottom: 4 }}>Compliance</label>
                  <div style={{ display: "flex", gap: S.s, flexWrap: "wrap" }}>
                    {complianceOpts.map((c) => (
                      <button key={c} type="button" onClick={() => toggleCompliance(c)} aria-pressed={ctx.compliance.includes(c)}
                        style={{ background: ctx.compliance.includes(c) ? T.aD : T.bg, border: `1px solid ${ctx.compliance.includes(c) ? T.aB : T.b}`, borderRadius: 6, padding: "4px 8px", fontSize: 10, color: ctx.compliance.includes(c) ? T.a : T.d, cursor: "pointer" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {id === "upload" && (
              <div style={{ marginTop: S.s }}>
                <input type="file" accept=".csv,.txt,.json,.tf,.yaml,.yml" onChange={handleFile} style={{ fontSize: 12 }} />
                {ctx.uploadedData && <span style={{ fontSize: 12, color: T.g, marginLeft: S.s }}>✓ {ctx.uploadedData.name}</span>}
              </div>
            )}
          </div>
        )
      ))}
    </div>
  );
}
