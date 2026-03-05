import { T } from "../lib/theme";
import { VBadge } from "./ui/Badge";

// Group history entries by overlapping title words (>4 chars, ignoring stop words)
const STOP = new Set(["with","from","that","this","what","have","will","their","into","about","using","between"]);
function topicWords(title) {
  return (title || "").toLowerCase().split(/\s+/).filter((w) => w.length > 4 && !STOP.has(w)).slice(0, 3);
}
function groupByTopic(history) {
  const groups = [];
  const assigned = new Set();
  for (let i = 0; i < history.length; i++) {
    if (assigned.has(i)) continue;
    const words = topicWords(history[i].meta?.title);
    const group = [history[i]];
    assigned.add(i);
    for (let j = i + 1; j < history.length; j++) {
      if (assigned.has(j)) continue;
      const otherWords = topicWords(history[j].meta?.title);
      if (words.some((w) => otherWords.includes(w))) {
        group.push(history[j]);
        assigned.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

function VerdictTrend({ items }) {
  if (items.length < 2) return null;
  const SCORE = { STRONGLY_RECOMMEND: 5, RECOMMEND: 4, RECOMMEND_WITH_CONDITIONS: 3, NEEDS_REVISION: 2, NOT_RECOMMENDED: 1 };
  const verdicts = items.map((h) => SCORE[h.meta?.verdict] ?? 0);
  const delta = verdicts[0] - verdicts[verdicts.length - 1];
  if (delta === 0) return <span style={{ fontSize: 10, color: T.d, fontFamily: T.mn }}>→ stable</span>;
  return <span style={{ fontSize: 10, color: delta > 0 ? T.g : T.rd, fontFamily: T.mn }}>{delta > 0 ? "↑ improving" : "↓ degrading"}</span>;
}

export function HistoryView({ history, onLoad, onCompare, currentBrief }) {
  if (!history.length) {
    return <p style={{ color: T.d, fontSize: 13, padding: 20 }}>No previous briefs saved yet. Generate a brief and it will appear here.</p>;
  }

  const groups = groupByTopic(history);

  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 20 }}>
          {groups.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: T.b }} />
              <span style={{ fontSize: 10, color: T.d, fontFamily: T.mn, fontWeight: 700, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                {group.length} RUN{group.length > 1 ? "S" : ""}
              </span>
              <VerdictTrend items={group} />
              <div style={{ flex: 1, height: 1, background: T.b }} />
            </div>
          )}
          {group.map((h, i) => {
            const isCurrent = currentBrief?._timestamp === h._timestamp;
            return (
              <div key={i} style={{ background: T.s, border: `1px solid ${isCurrent ? T.a : T.b}`, borderRadius: 8, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.t, cursor: "pointer", flex: 1 }} onClick={() => onLoad(h)}>
                    {h.meta?.title}
                    {isCurrent && <span style={{ fontSize: 10, color: T.a, fontFamily: T.mn, marginLeft: 8 }}>current</span>}
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <VBadge v={h.meta?.verdict} />
                    {!isCurrent && onCompare && (
                      <button
                        onClick={() => onCompare(h)}
                        style={{ fontSize: 10, color: T.a, background: T.aD, border: `1px solid ${T.aB}`, borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: T.mn, fontWeight: 600 }}
                      >
                        vs current
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: T.d, margin: "0 0 6px", cursor: "pointer" }} onClick={() => onLoad(h)}>
                  {h.meta?.executive_summary?.slice(0, 150)}…
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 9, color: T.d, fontFamily: T.mn }}>{h._timestamp || "No date"}</span>
                  {h.meta?.confidence_score && (
                    <span style={{ fontSize: 9, color: T.d, fontFamily: T.mn }}>Confidence: {h.meta.confidence_score}/10</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
