import { T } from "../lib/theme";
import { VBadge } from "./ui/Badge";

export function HistoryView({ history, onLoad }) {
  if (!history.length) {
    return <p style={{ color: T.d, fontSize: 13, padding: 20 }}>No previous briefs saved yet. Generate a brief and it will appear here.</p>;
  }
  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {history.map((h, i) => (
        <div
          key={i}
          style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 8, padding: 14, marginBottom: 8, cursor: "pointer" }}
          onClick={() => onLoad(h)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t }}>{h.meta?.title}</span>
            <VBadge v={h.meta?.verdict} />
          </div>
          <p style={{ fontSize: 11, color: T.d, margin: 0 }}>{h.meta?.executive_summary?.slice(0, 150)}...</p>
          <div style={{ fontSize: 9, color: T.d, fontFamily: T.mn, marginTop: 6 }}>{h._timestamp || "No date"}</div>
        </div>
      ))}
    </div>
  );
}
