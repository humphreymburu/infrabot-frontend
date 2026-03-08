import { T, S } from "../lib/theme";
import { Sec } from "./ui/Sec";
import { Badge, VBadge, GBadge, Dot, Bar, KV, WTag } from "./ui/Badge";
import type { Brief } from "../types";

export function BriefView({ d }: { d: Brief | null }) {
  if (!d) return null;
  const tc = d.meta?.trust_contract;
  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {(tc?.degraded_result || tc?.human_review_required_for_high_risk_adoption) && (
        <div style={{ background: T.rD, border: `1px solid ${T.rd}`, borderRadius: 10, padding: "10px 12px", marginBottom: S.m }}>
          <div style={{ fontSize: 10, color: T.rd, fontFamily: T.mn, fontWeight: 700, marginBottom: 4 }}>TRUST BOUNDARY</div>
          {tc?.degraded_result && (
            <div style={{ fontSize: 12, color: T.t, lineHeight: 1.5 }}>
              Degraded output is advisory only and must not be treated as approval.
            </div>
          )}
          {tc?.human_review_required_for_high_risk_adoption && (
            <div style={{ fontSize: 12, color: T.t, lineHeight: 1.5 }}>
              Human review is required before high-risk operational adoption.
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.s}, #E5E7EB)`, border: `1px solid ${T.aB}`, borderRadius: 16, padding: S.l, marginBottom: S.m, position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle, ${T.aD}, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: S.m, position: "relative" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: T.a, fontFamily: T.mn, fontWeight: 700, letterSpacing: "0.14em", marginBottom: S.s, textTransform: "uppercase" }}>Decision brief</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: T.t, margin: "0 0 " + S.s, lineHeight: 1.3, fontFamily: T.sn }}>{d.meta?.title}</h2>
            <p style={{ fontSize: 14, color: T.m, margin: 0, lineHeight: 1.7, fontFamily: T.sn }}>{d.meta?.executive_summary}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: S.s }}>
            <VBadge v={d.meta?.verdict} />
            <span style={{ fontSize: 12, color: T.m, fontFamily: T.sn }}>Confidence {d.meta?.confidence_score}/10</span>
          </div>
        </div>
      </div>

      {d.decision_statement && (
        <Sec title="Decision Statement" icon="1" defaultOpen>
          <p style={{ fontSize: 13, color: T.t, lineHeight: 1.7, margin: 0 }}>
            <strong>Decision to make:</strong> {d.decision_statement}
          </p>
        </Sec>
      )}

      {d.context && (
        <Sec title="Context" icon="2" defaultOpen>
          {([
            ["Current state", d.context.current_state],
            ["What changed", d.context.what_changed],
            ["Strategic alignment", d.context.strategic_alignment],
          ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
            <p key={i} style={{ fontSize: 12, color: T.m, margin: "0 0 6px", lineHeight: 1.6 }}>
              <strong style={{ color: T.t }}>{k}:</strong> {v}
            </p>
          ))}
          {!!d.context.constraints?.length && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Constraints</div>
              {d.context.constraints.map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {c}</div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {!!d.decision_criteria?.length && (
        <Sec title="Decision Criteria" icon="3" defaultOpen>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Criteria", "Weight", "Why it matters"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{d.decision_criteria.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{c.criterion}</td>
                  <td style={{ padding: 7, color: T.a, fontFamily: T.mn }}>{c.weight_pct ? `${c.weight_pct}%` : "—"}</td>
                  <td style={{ padding: 7, color: T.m }}>{c.why_it_matters}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {!!d.options_comparison?.dimensions?.length && (
        <Sec title="Options Compared" icon="4" defaultOpen>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Dimension", d.options_comparison.options?.[0] || "Option A", d.options_comparison.options?.[1] || "Option B", "Assessment"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{d.options_comparison.dimensions.map((dim, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{dim.dimension}</td>
                  <td style={{ padding: 7, color: T.m }}>{dim.option_a}</td>
                  <td style={{ padding: 7, color: T.m }}>{dim.option_b}</td>
                  <td style={{ padding: 7, color: T.d }}>{dim.assessment}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {/* Cost */}
      {d.cost_analysis && (
        <Sec title="Cost & Financial Analysis" icon="$">
          <p style={{ fontSize: 13, color: T.m, lineHeight: 1.7, margin: "0 0 14px" }}>{d.cost_analysis.narrative}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 14 }}>
            <KV label="Current Monthly" value={d.cost_analysis.current_state_monthly} mono color={T.m} />
            <KV label="Proposed Monthly" value={d.cost_analysis.proposed_monthly} mono color={T.a} />
            <KV label="Year 1" value={d.cost_analysis.year_1_total} mono />
            <KV label="Year 3" value={d.cost_analysis.year_3_total} mono />
            <KV label="Migration" value={d.cost_analysis.migration_one_time} mono color={T.o} />
            <KV label="ROI" value={d.cost_analysis.roi_timeline} />
          </div>
          {d.cost_analysis.pricing_details && d.cost_analysis.pricing_details.length > 0 && (
            <>
              <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn, marginBottom: 8 }}>VERIFIED PRICING</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr>{["Service", "Tier", "Unit Price", "Usage", "Monthly", "↗"].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{d.cost_analysis.pricing_details.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                      <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{p.service}</td>
                      <td style={{ padding: 7, color: T.m, fontFamily: T.mn, fontSize: 10 }}>{p.sku_or_tier}</td>
                      <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{p.unit_price}</td>
                      <td style={{ padding: 7, color: T.m }}>{p.estimated_usage}</td>
                      <td style={{ padding: 7, color: T.a, fontFamily: T.mn, fontWeight: 700 }}>{p.monthly_cost}</td>
                      <td style={{ padding: 7 }}>{p.source && <a href={p.source} target="_blank" rel="noreferrer" style={{ color: T.d, fontSize: 9, textDecoration: "none" }}>↗</a>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {d.cost_analysis.hidden_costs && d.cost_analysis.hidden_costs.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>HIDDEN COSTS</div>
                {d.cost_analysis.hidden_costs.map((c, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.m, padding: "3px 0", borderBottom: `1px solid ${T.b}` }}>
                    <strong style={{ color: T.t }}>{c.item}</strong> <span style={{ color: T.rd, fontFamily: T.mn }}>({c.estimated})</span>
                  </div>
                ))}
              </div>
            )}
            {d.cost_analysis.savings_opportunities && d.cost_analysis.savings_opportunities.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: T.g, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>SAVINGS</div>
                {d.cost_analysis.savings_opportunities.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.m, padding: "3px 0", borderBottom: `1px solid ${T.b}` }}>
                    <strong style={{ color: T.t }}>{s.opportunity}</strong> — <span style={{ color: T.g, fontFamily: T.mn }}>{s.potential_savings}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Sec>
      )}

      {d.financial_assumptions && (
        <Sec title="Financial Assumptions" icon="5" defaultOpen>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            <KV label="Monthly baseline" value={d.financial_assumptions.monthly_baseline} mono />
            <KV label="Migration cost" value={d.financial_assumptions.migration_cost} mono />
            <KV label="3-year TCO" value={d.financial_assumptions.tco_3y} mono />
          </div>
          {([
            ["Traffic assumption", d.financial_assumptions.traffic_assumption],
            ["Storage assumption", d.financial_assumptions.storage_assumption],
            ["Growth assumption", d.financial_assumptions.growth_assumption],
          ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
            <p key={i} style={{ fontSize: 12, color: T.m, margin: "8px 0 0", lineHeight: 1.6 }}>
              <strong style={{ color: T.t }}>{k}:</strong> {v}
            </p>
          ))}
          {!!d.financial_assumptions.assumptions?.length && (
            <div style={{ marginTop: 8 }}>
              {d.financial_assumptions.assumptions.map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {a}</div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {/* Technical Comparison */}
      {d.technical_comparison?.dimensions && d.technical_comparison.dimensions.length > 0 && (
        <Sec title="Technical Comparison" icon="⇔">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Dimension", "Current", "Proposed", "Assessment", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{d.technical_comparison.dimensions.map((dim, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{dim.dimension}</td>
                  <td style={{ padding: 7, color: T.m, maxWidth: 170 }}>{dim.current}</td>
                  <td style={{ padding: 7, color: T.m, maxWidth: 170 }}>{dim.proposed}</td>
                  <td style={{ padding: 7, color: T.d, fontSize: 11 }}>{dim.assessment}</td>
                  <td style={{ padding: 7 }}><WTag w={dim.winner} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {/* Architecture */}
      {d.architecture_review && (
        <Sec title="Architecture Review" icon="◈">
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t, marginBottom: 4 }}>{d.architecture_review.pattern_name}</div>
          <div style={{ fontSize: 12, color: T.d, marginBottom: 14 }}>{d.architecture_review.pattern_rationale}</div>
          {d.architecture_review.scores && Object.entries(d.architecture_review.scores).map(([k, v]) => (
            <Bar key={k} score={v?.rating} label={k.charAt(0).toUpperCase() + k.slice(1)} sub={v?.notes} />
          ))}
          {d.architecture_review.failure_modes && d.architecture_review.failure_modes.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>FAILURE MODES</div>
              {d.architecture_review.failure_modes.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
                  <Dot l={f.impact} />
                  <div><span style={{ color: T.t, fontWeight: 600 }}>{f.scenario}</span> — <span style={{ color: T.d }}>{f.mitigation}</span></div>
                </div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {/* Strategic */}
      {d.strategic_assessment && (
        <Sec title="Strategic Assessment" icon="◆" defaultOpen={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <KV label="Business Alignment" value={`${d.strategic_assessment.business_alignment?.score}/10`} />
            <KV label="Time to Value" value={d.strategic_assessment.time_to_value?.estimate} />
            <KV label="Org Readiness" value={`${d.strategic_assessment.organizational_readiness?.score}/10`} />
            <KV label="Vendor Lock-in" value={d.strategic_assessment.vendor_lock_in?.risk_level} color={({ CRITICAL: T.rd, HIGH: T.o, MEDIUM: T.y, LOW: T.g } as Record<string, string>)[d.strategic_assessment.vendor_lock_in?.risk_level ?? ""]} />
          </div>
          {([
            ["Competitive Impact", d.strategic_assessment.competitive_impact],
            ["Opportunity Cost", d.strategic_assessment.opportunity_cost],
            ["Exit Strategy", d.strategic_assessment.vendor_lock_in?.exit_strategy],
          ] as [string, string | undefined][]).filter(([, v]) => v).map(([l, v], i) => (
            <p key={i} style={{ fontSize: 12, color: T.m, lineHeight: 1.6, margin: "0 0 5px" }}>
              <strong style={{ color: T.t }}>{l}:</strong> {v}
            </p>
          ))}
        </Sec>
      )}

      {/* DevOps & SRE */}
      {d.devops_sre_assessment && (
        <Sec title="DevOps & SRE Assessment" icon="⚙" defaultOpen={false}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
            <KV label="CI/CD Complexity" value={d.devops_sre_assessment.ci_cd?.complexity} />
            <KV label="Setup Time" value={d.devops_sre_assessment.ci_cd?.estimated_setup} />
            <KV label="IaC Tool" value={d.devops_sre_assessment.infrastructure_as_code?.recommended_tool} />
            <KV label="Deploy Method" value={d.devops_sre_assessment.deployment_strategy?.method} />
          </div>
          {d.devops_sre_assessment.observability_stack && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 6, marginBottom: 10 }}>
              {["metrics", "logs", "traces", "alerting"].map((k) =>
                d.devops_sre_assessment?.observability_stack?.[k] && <KV key={k} label={k} value={d.devops_sre_assessment.observability_stack[k]} />
              )}
            </div>
          )}
          {d.devops_sre_assessment.reliability_engineering?.disaster_recovery && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
              <KV label="RPO" value={d.devops_sre_assessment.reliability_engineering.disaster_recovery.rpo} mono />
              <KV label="RTO" value={d.devops_sre_assessment.reliability_engineering.disaster_recovery.rto} mono />
              <KV label="DR Strategy" value={d.devops_sre_assessment.reliability_engineering.disaster_recovery.dr_strategy} />
            </div>
          )}
          {d.devops_sre_assessment.sre_risks && d.devops_sre_assessment.sre_risks.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: T.rD, borderRadius: 6, border: "1px solid rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>SRE RISKS</div>
              {d.devops_sre_assessment.sre_risks.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0", fontSize: 12 }}>
                  <Dot l={r.severity} /><span style={{ color: T.t }}>{r.risk}</span>
                </div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {/* Risk Register */}
      {d.risk_register && d.risk_register.length > 0 && (
        <Sec title="Risk Register" icon="⚠" defaultOpen={false}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["ID", "Cat", "Risk", "Score", "Mitigation", "Owner"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "5px 6px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{d.risk_register.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 6, fontFamily: T.mn, color: T.d }}>{r.id}</td>
                  <td style={{ padding: 6 }}><Badge color={T.m} bg={T.s}>{(r.category || "").slice(0, 5)}</Badge></td>
                  <td style={{ padding: 6, color: T.t, maxWidth: 180 }}>{r.risk}</td>
                  <td style={{ padding: 6, fontFamily: T.mn, fontWeight: 700, color: (r.risk_score ?? 0) >= 15 ? T.rd : (r.risk_score ?? 0) >= 9 ? T.y : T.g }}>{r.risk_score}</td>
                  <td style={{ padding: 6, color: T.d, maxWidth: 180 }}>{r.mitigation}</td>
                  <td style={{ padding: 6, color: T.d }}>{r.owner}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {/* Alternatives */}
      {d.alternatives && d.alternatives.length > 0 && (
        <Sec title="Alternatives" icon="⇔" defaultOpen={false}>
          {d.alternatives.map((alt, i) => (
            <div key={i} style={{ background: T.s, padding: 14, borderRadius: 8, border: `1px solid ${T.b}`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.t }}>{alt.name}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Badge color={T.m} bg={T.r}>{alt.cost_vs_proposed}</Badge>
                  <Badge color={T.m} bg={T.r}>{alt.timeline_vs_proposed}</Badge>
                </div>
              </div>
              <p style={{ fontSize: 12, color: T.m, margin: "0 0 8px", lineHeight: 1.6 }}>{alt.approach}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>{alt.pros?.map((p, j) => <div key={j} style={{ fontSize: 11, color: T.g, padding: "1px 0" }}>+ {p}</div>)}</div>
                <div>{alt.cons?.map((c, j) => <div key={j} style={{ fontSize: 11, color: T.rd, padding: "1px 0" }}>− {c}</div>)}</div>
              </div>
              {alt.when_to_prefer && <div style={{ marginTop: 6, fontSize: 11, color: T.a, fontStyle: "italic" }}>→ Best when: {alt.when_to_prefer}</div>}
            </div>
          ))}
        </Sec>
      )}

      {/* Roadmap */}
      {d.implementation_roadmap && (
        <Sec title="Implementation Roadmap" icon="▶" defaultOpen={false}>
          <KV label="Total Duration" value={d.implementation_roadmap.total_duration} />
          <div style={{ position: "relative", paddingLeft: 22, marginTop: 14 }}>
            <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: T.b }} />
            {d.implementation_roadmap.phases?.map((p, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 18 }}>
                <div style={{ position: "absolute", left: -18, top: 4, width: 10, height: 10, borderRadius: "50%", background: T.a, border: `2px solid ${T.r}` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.t }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: T.a, fontFamily: T.mn, fontWeight: 600 }}>{p.duration}</span>
                </div>
                {p.deliverables?.map((del, j) => <div key={j} style={{ fontSize: 12, color: T.m, padding: "1px 0" }}>→ {del}</div>)}
                {p.gate_criteria && <div style={{ fontSize: 11, color: T.y, marginTop: 3 }}>Gate: {p.gate_criteria}</div>}
              </div>
            ))}
          </div>
          {d.implementation_roadmap.quick_wins && d.implementation_roadmap.quick_wins.length > 0 && (
            <div style={{ padding: "8px 12px", background: T.gD, borderRadius: 6, border: "1px solid rgba(52,211,153,0.12)", marginTop: 8 }}>
              <div style={{ fontSize: 9, color: T.g, fontWeight: 700, fontFamily: T.mn, marginBottom: 4 }}>QUICK WINS</div>
              {d.implementation_roadmap.quick_wins.map((w, i) => <div key={i} style={{ fontSize: 12, color: "rgba(52,211,153,0.8)" }}>✓ {w}</div>)}
            </div>
          )}
        </Sec>
      )}

      {/* Final Recommendation */}
      {d.recommendation && (
        <div style={{ background: `linear-gradient(135deg, ${T.s}, #E5E7EB)`, border: `1px solid ${T.aB}`, borderRadius: 16, padding: S.l, marginBottom: S.m, position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 180, height: 180, background: `radial-gradient(circle, ${T.aD}, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8, position: "relative" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.a, letterSpacing: "0.14em", fontFamily: T.mn, textTransform: "uppercase" }}>Final recommendation</span>
            <GBadge v={d.recommendation.decision} />
          </div>
          <p style={{ fontSize: 14, color: T.t, lineHeight: 1.7, margin: "0 0 14px", fontWeight: 500, position: "relative" }}>{d.recommendation.rationale}</p>
          {d.recommendation.conditions && d.recommendation.conditions.length > 0 && (
            <div style={{ marginBottom: 12, position: "relative" }}>
              <div style={{ fontSize: 9, color: T.y, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>CONDITIONS</div>
              {d.recommendation.conditions.map((c, i) => <div key={i} style={{ fontSize: 12, color: "rgba(251,191,36,0.8)", padding: "2px 0" }}>⚬ {c}</div>)}
            </div>
          )}
          <div style={{ marginBottom: 12, position: "relative" }}>
            <div style={{ fontSize: 9, color: T.d, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>NEXT STEPS</div>
            {d.recommendation.next_steps?.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
                <span style={{ color: T.t }}>{i + 1}. {s.step}</span>
                <span style={{ color: T.d, whiteSpace: "nowrap", marginLeft: 10 }}>{s.owner} · {s.deadline}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative" }}>
            <div style={{ padding: "9px 12px", background: T.s, borderRadius: 6, border: `1px solid ${T.b}` }}>
              <div style={{ fontSize: 9, color: T.d, fontFamily: T.mn, marginBottom: 2 }}>DEADLINE</div>
              <div style={{ fontSize: 12, color: T.t, fontWeight: 600 }}>{d.recommendation.decision_deadline}</div>
            </div>
            <div style={{ padding: "9px 12px", background: T.rD, borderRadius: 6, border: "1px solid rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize: 9, color: T.rd, fontFamily: T.mn, marginBottom: 2 }}>COST OF DELAY</div>
              <div style={{ fontSize: 12, color: "rgba(248,113,113,0.9)" }}>{d.recommendation.what_happens_if_we_wait}</div>
            </div>
          </div>
        </div>
      )}

      {d.decision_boundary && (
        <Sec title="Decision Boundary" icon="7" defaultOpen>
          {([
            ["Recommend Option A if", d.decision_boundary.recommend_option_a_if],
            ["Recommend Option B if", d.decision_boundary.recommend_option_b_if],
            ["What flips decision", d.decision_boundary.what_flips_decision],
          ] as [string, string[] | undefined][]).map(([title, items], i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>{title}</div>
              {(items || []).length ? (
                (items || []).map((it, j) => <div key={j} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {it}</div>)
              ) : (
                <div style={{ fontSize: 12, color: T.d }}>—</div>
              )}
            </div>
          ))}
        </Sec>
      )}
    </div>
  );
}
