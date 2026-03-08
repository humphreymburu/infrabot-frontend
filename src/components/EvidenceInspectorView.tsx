import { T, S } from "../lib/theme";
import type { Brief } from "../types";

export function EvidenceInspectorView({ d }: { d: Brief | null }) {
  if (!d) return null;
  const g = d.evidence_governance;
  const graph = g?.claim_citation_graph || [];
  const unsupported = g?.unsupported_claims_visible || [];
  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Evidence Inspector</h3>
      {!g && <div style={{ color: T.d, fontSize: 12 }}>No governance data on this brief.</div>}
      {g && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: T.t }}>Pass: <strong style={{ color: g.pass ? T.g : T.rd }}>{String(!!g.pass)}</strong></div>
            <div style={{ fontSize: 12, color: T.t }}>Tier: <strong>{g.risk_tier || "—"}</strong></div>
            <div style={{ fontSize: 12, color: T.t }}>Citations: <strong>{g.citations_total ?? 0}</strong></div>
            <div style={{ fontSize: 12, color: T.t }}>Trusted: <strong>{g.trusted_count ?? 0}</strong></div>
            <div style={{ fontSize: 12, color: T.t }}>Primary: <strong>{g.primary_count ?? 0}</strong></div>
            <div style={{ fontSize: 12, color: T.t }}>
              High-risk mapped: <strong>{g.high_risk_claims_mapped ?? 0}/{g.high_risk_claims_total ?? 0}</strong>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.m, marginBottom: 8 }}>
            Min citations: {g.min_citations_required ?? 0} • Min trusted: {g.min_trusted_required ?? 0}
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>Violations</div>
            {(g.violations || []).length ? (
              (g.violations || []).map((v, i) => <div key={i} style={{ fontSize: 12, color: T.rd, padding: "2px 0" }}>• {v}</div>)
            ) : (
              <div style={{ fontSize: 12, color: T.g }}>No violations</div>
            )}
          </div>
          {!!g.blocked_urls?.length && (
            <div>
              <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>Blocked URLs</div>
              {g.blocked_urls.map((u, i) => (
                <div key={i} style={{ fontSize: 11, color: T.rd, fontFamily: T.mn, padding: "2px 0", wordBreak: "break-all" }}>{u}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>Claim-linked citation graph</div>
            {!graph.length && <div style={{ fontSize: 12, color: T.d }}>No claim-source links in this brief.</div>}
            {!!graph.length && (
              <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, maxHeight: 280, overflow: "auto", background: T.bg }}>
                {graph.map((c, i) => (
                  <div key={`${c.claim_id || "claim"}-${i}`} style={{ padding: 8, borderBottom: `1px solid ${T.b}` }}>
                    <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>
                      {c.claim_id} • {c.claim_class} • {c.brief_section}
                    </div>
                    <div style={{ fontSize: 12, color: T.t, margin: "3px 0" }}>{c.claim_text}</div>
                    <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn, wordBreak: "break-all" }}>
                      source={c.source_id} • strength={c.support_strength} • contradiction={c.contradiction_status} • governance={c.governance_status}
                    </div>
                    {!!c.source_url && (
                      <div style={{ fontSize: 11, color: T.a, marginTop: 2, wordBreak: "break-all" }}>{c.source_url}</div>
                    )}
                    {!!c.source_span && (
                      <div style={{ fontSize: 11, color: T.m, marginTop: 2 }}>excerpt: {c.source_span}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>Unsupported / weak / contradicted claims</div>
            {!unsupported.length && <div style={{ fontSize: 12, color: T.g }}>No unsupported claims flagged</div>}
            {!!unsupported.length && unsupported.map((u, i) => (
              <div key={`${u.claim_id || "u"}-${i}`} style={{ fontSize: 12, color: T.rd, padding: "3px 0" }}>
                {u.claim_id} [{u.claim_class}] {u.governance_status} {u.contradiction_status === "contradicted" ? "(contradicted)" : ""} — {u.claim_text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
