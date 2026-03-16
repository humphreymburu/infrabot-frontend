import { T } from "../lib/theme";
import { Badge } from "./ui/Badge";
import type { AgentProgressMap, SearchEntry, SharedEvidenceItem, WorkflowGraphState, WorkflowNodeStatus } from "../types";

const STATUS_STYLES: Record<WorkflowNodeStatus, { dot: string; label: string }> = {
  pending: { dot: T.d, label: "Pending" },
  running: { dot: T.a, label: "Running" },
  done: { dot: T.g, label: "Done" },
  error: { dot: T.rd, label: "Error" },
};

interface NanobotWorkflowViewProps {
  graph: WorkflowGraphState | null;
  phaseLabel?: string;
  progress?: AgentProgressMap;
  searchLog?: SearchEntry[];
  sharedEvidence?: {
    globalSearchPreview: Array<{ title?: string; url?: string }>;
    byAgent: SharedEvidenceItem[];
  };
}

export function NanobotWorkflowView({ graph, phaseLabel, progress, searchLog = [], sharedEvidence }: NanobotWorkflowViewProps) {
  if (!graph || graph.nodes.length === 0) return null;

  const lanes = ["intake", "researching", "evaluating", "revising", "synthesizing", "done"];
  const nodesByLane = lanes.map((lane) => ({
    lane,
    nodes: graph.nodes.filter((n) => n.stage === lane),
  }));

  const activeAgents = progress
    ? Object.entries(progress)
      .filter(([, st]) => ["searching", "analyzing", "working"].includes(st))
      .map(([agent]) => agent)
    : [];

  const isActiveEdge = (from: string, to: string): boolean => {
    const a = graph.state[from];
    const b = graph.state[to];
    return (a === "done" || a === "running") && (b === "running" || b === "done");
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: "0 8px 28px rgba(2,6,23,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: T.mn, color: T.a, fontWeight: 700, letterSpacing: "0.12em" }}>ORCHESTRATOR</div>
          <div style={{ fontSize: 13, color: T.t, fontWeight: 600, marginTop: 4 }}>
            {phaseLabel || "Workflow execution"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>
            {graph.nodes.filter((n) => graph.state[n.id] === "done").length}/{graph.nodes.length} done
          </span>
          <span style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>
            active {activeAgents.length}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(140px, 1fr))", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {nodesByLane.map(({ lane, nodes }) => (
          <div key={lane} style={{ minWidth: 140, background: T.bg, border: `1px solid ${T.b}`, borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, color: T.m, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mn }}>{lane}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {nodes.map((node) => {
                const st = graph.state[node.id] || "pending";
                const ui = STATUS_STYLES[st];
                const rt = graph.runtime[node.id] || {};
                return (
                  <div key={node.id} style={{ border: `1px solid ${st === "running" ? T.aB : T.b}`, background: st === "running" ? T.aD : T.s, borderRadius: 8, padding: "8px 9px" }}>
                    <div style={{ fontSize: 12, color: T.t, fontWeight: 600 }}>{node.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: ui.dot, animation: st === "running" ? "pulse 1s infinite" : "none" }} />
                      <span style={{ fontSize: 11, color: ui.dot, fontFamily: T.mn, fontWeight: 700 }}>{ui.label}</span>
                    </div>
                    {typeof rt.durationMs === "number" && (
                      <div style={{ fontSize: 11, color: T.m, marginTop: 4, fontFamily: T.mn }}>
                        {Math.round(rt.durationMs)}ms
                      </div>
                    )}
                    {rt.lastTs && (
                      <div style={{ fontSize: 11, color: T.m, marginTop: 2, fontFamily: T.mn }}>
                        {new Date(rt.lastTs).toLocaleTimeString()}
                      </div>
                    )}
                    {st === "error" && rt.lastError && (
                      <div style={{ fontSize: 11, color: T.rd, marginTop: 4 }}>{rt.lastError}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg }}>
        <div style={{ fontSize: 11, color: T.m, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mn }}>Active Edges</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {graph.edges.filter((e) => isActiveEdge(e.from, e.to)).map((edge, idx) => (
            <span
              key={`${edge.from}-${edge.to}-${idx}`}
              style={{
                fontSize: 11,
                fontFamily: T.mn,
                color: T.a,
                border: `1px solid ${T.aB}`,
                background: T.aD,
                borderRadius: 999,
                padding: "3px 8px",
              }}
            >
              {edge.from}→{edge.to}
            </span>
          ))}
          {graph.edges.filter((e) => isActiveEdge(e.from, e.to)).length === 0 && (
            <span style={{ fontSize: 11, color: T.m }}>No active transitions.</span>
          )}
        </div>
      </div>

      {progress && (
        <div style={{ marginTop: 12, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg }}>
          <div style={{ fontSize: 11, color: T.m, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mn }}>Agent Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(progress).map(([agent, status]) => (
              <Badge key={agent} color={status === "error" ? T.rd : status === "done" ? T.g : T.a} bg={status === "error" ? T.rD : status === "done" ? T.gD : T.aD}>
                {agent}:{status}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {searchLog.length > 0 && (
        <div style={{ marginTop: 12, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg }}>
          <div style={{ fontSize: 11, color: T.m, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mn }}>
            Live Research ({searchLog.length})
          </div>
          <div style={{ maxHeight: 140, overflowY: "auto" }}>
            {searchLog.slice(-12).map((s, i) => (
              <div key={`${s.agent}-${s.ts}-${i}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn, padding: "3px 0", borderBottom: `1px solid ${T.b}` }}>
                [{s.agent}] {s.query}
              </div>
            ))}
          </div>
        </div>
      )}
      {sharedEvidence && (sharedEvidence.globalSearchPreview.length > 0 || sharedEvidence.byAgent.length > 0) && (
        <div style={{ marginTop: 12, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg }}>
          <div style={{ fontSize: 11, color: T.m, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mn }}>
            Shared Context Index
          </div>
          {sharedEvidence.globalSearchPreview.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: T.t, marginBottom: 4 }}>Global Search Baseline</div>
              {sharedEvidence.globalSearchPreview.map((r, i) => (
                <div key={`${r.url || "g"}-${i}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn, padding: "2px 0" }}>
                  {r.title || r.url || "result"}
                </div>
              ))}
            </div>
          )}
          {sharedEvidence.byAgent.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.t, marginBottom: 4 }}>Per-Agent Evidence</div>
              {sharedEvidence.byAgent.map((a, i) => (
                <div key={`${a.agent}-${i}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn, padding: "2px 0" }}>
                  {a.agent}: {a.results.length} result(s)
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
