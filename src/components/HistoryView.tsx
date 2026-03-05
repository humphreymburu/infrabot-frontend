import { T } from "../lib/theme";
import type { Brief } from "../types";

interface HistoryViewProps {
  history: Brief[];
  onLoad: (brief: Brief) => void;
  onCompare: (brief: Brief) => void;
  currentBrief: Brief | null;
}

const fmtDate = (iso?: string): string => {
  if (!iso) return "Unknown time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

export function HistoryView({ history, onLoad, onCompare, currentBrief }: HistoryViewProps) {
  if (history.length === 0) {
    return (
      <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.m }}>No saved analyses yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10, animation: "briefIn 0.5s ease" }}>
      {history.map((item, index) => {
        const title = item.meta?.title || "Untitled analysis";
        const summary = item.meta?.executive_summary || item.meta?.proposal_summary || "No summary available.";
        const active = currentBrief?._timestamp && item._timestamp === currentBrief._timestamp;
        return (
          <div
            key={`${item._timestamp || "brief"}-${index}`}
            style={{
              background: T.s,
              border: `1px solid ${active ? T.aB : T.b}`,
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.t, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                <div style={{ fontSize: 11, color: T.d, marginTop: 2 }}>{fmtDate(item._timestamp)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onLoad(item)}
                  style={{ border: `1px solid ${T.b}`, background: T.s, color: T.t, borderRadius: 999, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => onCompare(item)}
                  style={{ border: `1px solid ${T.aB}`, background: T.aD, color: T.a, borderRadius: 999, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
                >
                  Compare
                </button>
              </div>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12, color: T.m, lineHeight: 1.5 }}>
              {summary}
            </p>
          </div>
        );
      })}
    </div>
  );
}
