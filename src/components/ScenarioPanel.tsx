import { T } from "../lib/theme";
import { Sec } from "./ui/Sec";
import type { AppState, Action } from "../types";
import { Dispatch } from "react";

interface ScenarioPanelProps {
  state: AppState;
  dispatch: Dispatch<Action>;
  onReanalyze: () => void;
}

export function ScenarioPanel({ state, dispatch, onReanalyze }: ScenarioPanelProps) {
  const overrides = state.scenarioOverrides;
  const set = (k: string, v: string) => dispatch({ type: "SET_SCENARIO", value: { [k]: v } });

  return (
    <Sec title="What-If Scenario Modeling" icon="⚡" defaultOpen={true}>
      <p style={{ fontSize: 12, color: T.d, margin: "0 0 12px", lineHeight: 1.6 }}>
        Adjust assumptions below and re-run analysis on affected sections only.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 9, color: T.d, fontFamily: T.mn, fontWeight: 700, display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>TRAFFIC MULTIPLIER</label>
          <select value={overrides.trafficMultiplier || "1x"} onChange={(e) => set("trafficMultiplier", e.target.value)}
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: T.t }}>
            {["1x", "2x", "5x", "10x"].map((o) => <option key={o} value={o}>{o} current load</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 9, color: T.d, fontFamily: T.mn, fontWeight: 700, display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>TIMELINE CHANGE</label>
          <select value={overrides.timelineChange || "no_change"} onChange={(e) => set("timelineChange", e.target.value)}
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: T.t }}>
            {([["no_change", "No change"], ["halved", "Cut in half"], ["doubled", "Double the time"], ["urgent", "Must ship in 90 days"]] as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 9, color: T.d, fontFamily: T.mn, fontWeight: 700, display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>ADD TEAM MEMBERS</label>
          <select value={overrides.teamChange || "none"} onChange={(e) => set("teamChange", e.target.value)}
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: T.t }}>
            {([["none", "No change"], ["+2_sre", "+2 SREs"], ["+3_dev", "+3 Developers"], ["-2_any", "Lose 2 engineers"]] as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 9, color: T.d, fontFamily: T.mn, fontWeight: 700, display: "block", marginBottom: 4, letterSpacing: "0.1em" }}>ADD COMPLIANCE</label>
          <select value={overrides.addCompliance || "none"} onChange={(e) => set("addCompliance", e.target.value)}
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.b}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, color: T.t }}>
            {([["none", "No change"], ["soc2", "Add SOC 2"], ["hipaa", "Add HIPAA"], ["fedramp", "Add FedRAMP"]] as [string, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onReanalyze}
        style={{ background: "#FFFFFF", color: T.a, border: `1px solid ${T.aB}`, borderRadius: 999, padding: "8px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: T.sn, letterSpacing: "0.02em" }}
      >
        Re-analyze with scenario
      </button>
    </Sec>
  );
}
