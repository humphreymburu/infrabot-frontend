import { T } from "../lib/theme";
import { Badge } from "./ui/Badge";
import type { AgentProgressMap, SearchEntry } from "../types";

const AGENTS = [
  { key: "planner", label: "Policy Planner", icon: "⌁" },
  { key: "compress", label: "Input Compressor", icon: "⇣" },
  { key: "cost", label: "Cost Modeler", icon: "$" },
  { key: "arch", label: "Architecture Analyst", icon: "◈" },
  { key: "ops", label: "Operations & SRE", icon: "⚙" },
  { key: "strategy", label: "Strategy Agent", icon: "◆" },
  { key: "evaluator", label: "Critical Review", icon: "⚠" },
  { key: "synthesis", label: "Synthesis Engine", icon: "◉" },
];

const STATUS_COLOR: Record<string, string> = { pending: T.d, searching: T.y, analyzing: T.o, working: T.y, done: T.g, error: T.rd };
const STATUS_LABEL: Record<string, string> = { pending: "Waiting", searching: "Searching", analyzing: "Processing", working: "Processing", done: "Completed", error: "Failed" };

interface AgentProgressProps {
  progress: AgentProgressMap;
  searchLog: SearchEntry[];
}

export function AgentProgress({ progress, searchLog }: AgentProgressProps) {
  const active = AGENTS.filter(({ key }) => ["searching", "analyzing", "working"].includes(progress[key as keyof AgentProgressMap]));
  const completed = AGENTS.filter(({ key }) => progress[key as keyof AgentProgressMap] === "done").length;
  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontFamily: T.mn, color: T.a, fontWeight: 700, letterSpacing: "0.12em" }}>MULTI-AGENT PIPELINE</div>
        <div style={{ fontSize: 10, fontFamily: T.mn, color: T.m, fontWeight: 700, letterSpacing: "0.08em" }}>{completed}/{AGENTS.length} completed</div>
      </div>

      {active.length > 0 ? (
        <div style={{ fontSize: 11, color: T.t, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.a, animation: "pulse 1s infinite" }} />
          <span style={{ fontWeight: 600 }}>Active:</span>
          <span style={{ color: T.m }}>
            {active.map((a) => a.label).join(active.length > 2 ? ", " : " & ")}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: T.m, marginBottom: 12 }}>No agents currently running.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 16 }}>
        {AGENTS.map(({ key, label, icon }) => (
          <div key={key} style={{ background: T.bg, border: `1px solid ${progress[key as keyof AgentProgressMap] === "done" ? "rgba(52,211,153,0.2)" : T.b}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{icon}</span>
              <span style={{ fontSize: 10, color: T.t, fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[progress[key as keyof AgentProgressMap]], animation: ["searching", "analyzing", "working"].includes(progress[key as keyof AgentProgressMap]) ? "pulse 1s infinite" : "none" }} />
              <span style={{ fontSize: 9, color: STATUS_COLOR[progress[key as keyof AgentProgressMap]], fontFamily: T.mn, fontWeight: 600, letterSpacing: "0.08em" }}>{STATUS_LABEL[progress[key as keyof AgentProgressMap]]}</span>
            </div>
          </div>
        ))}
      </div>

      {searchLog.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontFamily: T.mn, color: T.d, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>LIVE RESEARCH LOG ({searchLog.length} searches)</div>
          <div style={{ maxHeight: 200, overflowY: "auto", background: T.bg, borderRadius: 6, padding: "8px 12px", border: `1px solid ${T.b}` }}>
            {searchLog.map((s, i) => (
              <div key={i} style={{ fontSize: 10, fontFamily: T.mn, color: T.m, padding: "3px 0", display: "flex", gap: 8, borderBottom: `1px solid ${T.b}` }}>
                <Badge color={T.a} bg={T.aD}>{s.agent}</Badge>
                <span style={{ color: T.d }}>{s.query}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
