import { T } from "../lib/theme";
import { Sec } from "./ui/Sec";
import { Badge, KV } from "./ui/Badge";

export function DevilsView({ d }) {
  if (!d?.devils_advocate) return <p style={{ color: T.d, fontSize: 13, padding: 20 }}>No critical review available.</p>;
  const da = d.devils_advocate;
  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      <div style={{ background: T.rD, border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 22, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.rd, letterSpacing: "0.15em", fontFamily: T.mn, marginBottom: 10 }}>⚠ DEVIL'S ADVOCATE REVIEW</div>
        <p style={{ fontSize: 14, color: T.t, lineHeight: 1.7, margin: "0 0 14px" }}>{da.overall_assessment}</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <KV label="Revised Confidence" value={`${da.revised_confidence}/10`} color={da.revised_confidence >= 7 ? T.g : da.revised_confidence >= 5 ? T.y : T.rd} />
          <KV label="Revised Verdict" value={da.revised_verdict?.replace(/_/g, " ")} />
        </div>
      </div>

      {da.challenges?.length > 0 && (
        <Sec title={`Challenges (${da.challenges.length})`} icon="✗">
          {da.challenges.map((c, i) => (
            <div key={i} style={{ background: T.s, padding: 14, borderRadius: 8, border: `1px solid ${T.b}`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.t, fontWeight: 600 }}>{c.claim}</span>
                <Badge color={c.severity === "CRITICAL" ? T.rd : c.severity === "HIGH" ? T.o : T.y} bg={c.severity === "CRITICAL" ? T.rD : T.yD}>{c.severity}</Badge>
              </div>
              <p style={{ fontSize: 12, color: T.m, margin: "0 0 4px" }}>{c.challenge}</p>
              <p style={{ fontSize: 11, color: T.g, margin: 0 }}>→ {c.suggestion}</p>
            </div>
          ))}
        </Sec>
      )}

      {da.missing_considerations?.length > 0 && (
        <Sec title="Missing Considerations" icon="?" defaultOpen={false}>
          {da.missing_considerations.map((m, i) => (
            <div key={i} style={{ fontSize: 12, color: T.m, padding: "4px 0", borderBottom: `1px solid ${T.b}` }}>• {m}</div>
          ))}
        </Sec>
      )}

      {(da.cost_flags?.length > 0 || da.timeline_flags?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {da.cost_flags?.length > 0 && (
            <Sec title="Cost Flags" icon="$" defaultOpen={false}>
              {da.cost_flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: T.o, padding: "3px 0" }}>⚠ {f}</div>)}
            </Sec>
          )}
          {da.timeline_flags?.length > 0 && (
            <Sec title="Timeline Flags" icon="⏱" defaultOpen={false}>
              {da.timeline_flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: T.o, padding: "3px 0" }}>⚠ {f}</div>)}
            </Sec>
          )}
        </div>
      )}
    </div>
  );
}
