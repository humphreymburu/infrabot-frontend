import { T } from "../lib/theme";
import { Sec } from "./ui/Sec";
import { VBadge } from "./ui/Badge";

const VERDICT_ORDER = ["STRONGLY_RECOMMEND", "RECOMMEND", "RECOMMEND_WITH_CONDITIONS", "NEEDS_REVISION", "NOT_RECOMMENDED"];

function verdictDelta(a, b) {
  const ai = VERDICT_ORDER.indexOf(a);
  const bi = VERDICT_ORDER.indexOf(b);
  if (ai === -1 || bi === -1 || ai === bi) return null;
  return ai < bi ? "improved" : "degraded";
}

function ScoreDelta({ label, prev, curr }) {
  if (prev == null || curr == null) return null;
  const diff = curr - prev;
  if (diff === 0) return null;
  const color = diff > 0 ? T.g : T.rd;
  const sign = diff > 0 ? "+" : "";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
      <span style={{ color: T.m }}>{label}</span>
      <span style={{ fontFamily: T.mn, color }}>
        {prev} → {curr} <span style={{ fontSize: 10 }}>({sign}{diff})</span>
      </span>
    </div>
  );
}

function CostDelta({ label, prev, curr }) {
  if (!prev && !curr) return null;
  const changed = prev !== curr;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
      <span style={{ color: T.m }}>{label}</span>
      <span style={{ fontFamily: T.mn, color: changed ? T.y : T.d }}>
        {prev ?? "—"} → {curr ?? "—"}
      </span>
    </div>
  );
}

export function DiffView({ current, previous }) {
  if (!current || !previous) {
    return <p style={{ color: T.d, fontSize: 13, padding: 20 }}>No previous brief to compare against. Run another analysis to see what changed.</p>;
  }

  const vd = verdictDelta(previous.meta?.verdict, current.meta?.verdict);
  const confDiff = (current.meta?.confidence_score ?? 0) - (previous.meta?.confidence_score ?? 0);
  const archScores = current.architecture_review?.scores ?? {};
  const prevArchScores = previous.architecture_review?.scores ?? {};

  const changedScores = Object.entries(archScores)
    .map(([k, v]) => ({ key: k, curr: v?.rating, prev: prevArchScores[k]?.rating }))
    .filter(({ curr, prev }) => curr != null && prev != null && curr !== prev);

  const riskDiff = (current.risk_register?.length ?? 0) - (previous.risk_register?.length ?? 0);

  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {/* Header summary */}
      <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.a, letterSpacing: "0.15em", fontFamily: T.mn, marginBottom: 12 }}>WHAT CHANGED</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 4 }}>PREVIOUS</div>
            <div style={{ fontSize: 12, color: T.t, fontWeight: 600, marginBottom: 4 }}>{previous.meta?.title ?? "Previous brief"}</div>
            <VBadge v={previous.meta?.verdict} />
            <span style={{ fontSize: 11, color: T.d, fontFamily: T.mn, marginLeft: 8 }}>Confidence: {previous.meta?.confidence_score}/10</span>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 4 }}>CURRENT</div>
            <div style={{ fontSize: 12, color: T.t, fontWeight: 600, marginBottom: 4 }}>{current.meta?.title ?? "Current brief"}</div>
            <VBadge v={current.meta?.verdict} />
            <span style={{ fontSize: 11, color: T.d, fontFamily: T.mn, marginLeft: 8 }}>Confidence: {current.meta?.confidence_score}/10</span>
          </div>
        </div>

        {vd && (
          <div style={{ background: vd === "improved" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${vd === "improved" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: vd === "improved" ? T.g : T.rd, marginBottom: 8 }}>
            {vd === "improved" ? "↑ Verdict improved" : "↓ Verdict degraded"}: {previous.meta?.verdict?.replace(/_/g, " ")} → {current.meta?.verdict?.replace(/_/g, " ")}
          </div>
        )}
        {confDiff !== 0 && (
          <div style={{ fontSize: 12, color: confDiff > 0 ? T.g : T.rd, fontFamily: T.mn }}>
            Confidence: {confDiff > 0 ? "+" : ""}{confDiff} ({previous.meta?.confidence_score} → {current.meta?.confidence_score})
          </div>
        )}
      </div>

      {/* Cost changes */}
      <Sec title="Cost Changes" icon="$" defaultOpen={true}>
        <CostDelta label="Proposed monthly" prev={previous.cost_analysis?.proposed_monthly} curr={current.cost_analysis?.proposed_monthly} />
        <CostDelta label="Year 1 total" prev={previous.cost_analysis?.year_1_total} curr={current.cost_analysis?.year_1_total} />
        <CostDelta label="ROI timeline" prev={previous.cost_analysis?.roi_timeline} curr={current.cost_analysis?.roi_timeline} />
      </Sec>

      {/* Architecture score changes */}
      {changedScores.length > 0 && (
        <Sec title={`Architecture Score Changes (${changedScores.length})`} icon="◈" defaultOpen={true}>
          {changedScores.map(({ key, prev, curr }) => (
            <ScoreDelta key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} prev={prev} curr={curr} />
          ))}
        </Sec>
      )}

      {/* Risk register delta */}
      {riskDiff !== 0 && (
        <Sec title="Risk Register" icon="⚠" defaultOpen={false}>
          <div style={{ fontSize: 12, color: riskDiff > 0 ? T.rd : T.g, padding: "6px 0" }}>
            {riskDiff > 0 ? `+${riskDiff} new risks identified` : `${Math.abs(riskDiff)} risks resolved`}
            {" "}({previous.risk_register?.length ?? 0} → {current.risk_register?.length ?? 0} total)
          </div>
        </Sec>
      )}

      {/* Executive summary diff */}
      {previous.meta?.executive_summary !== current.meta?.executive_summary && (
        <Sec title="Executive Summary" icon="≡" defaultOpen={false}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 4 }}>PREVIOUS</div>
            <p style={{ fontSize: 12, color: T.m, lineHeight: 1.6, margin: 0 }}>{previous.meta?.executive_summary}</p>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 4 }}>CURRENT</div>
            <p style={{ fontSize: 12, color: T.t, lineHeight: 1.6, margin: 0 }}>{current.meta?.executive_summary}</p>
          </div>
        </Sec>
      )}

      {changedScores.length === 0 && !vd && confDiff === 0 && riskDiff === 0 && (
        <p style={{ fontSize: 13, color: T.d, padding: "20px 0" }}>No significant changes detected between these two briefs.</p>
      )}
    </div>
  );
}
