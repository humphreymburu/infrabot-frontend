import { T, S } from "../lib/theme";
import { Sec } from "./ui/Sec";
import { Badge, VBadge, GBadge, Dot, Bar, KV, WTag } from "./ui/Badge";
import type { Brief } from "../types";

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter((v) => v.trim().length > 0);
  if (typeof value === "string") return value.split(/[,\n]/).map((v) => v.trim()).filter(Boolean);
  return [];
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNextSteps(value: unknown): Array<{ step: string; owner?: string; deadline?: string }> {
  const inferOwner = (step: string): string => {
    const s = step.toLowerCase();
    if (/(benchmark|harness|latency|p99|performance)/.test(s)) return "Platform Engineering Lead";
    if (/(azure|tier|sku|capacity|architecture|poc)/.test(s)) return "Cloud Architect";
    if (/(migration|backfill|dual-write|cutover|index|etl)/.test(s)) return "Data Platform Lead";
    if (/(alert|dashboard|slo|runbook|incident|observability)/.test(s)) return "SRE Lead";
    if (/(cost|tco|pricing|finops)/.test(s)) return "FinOps Lead";
    return "Engineering Manager";
  };
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (typeof v === "string") return { step: v };
      if (v && typeof v === "object") {
        const row = v as Record<string, unknown>;
        return {
          step: String(row.step || "").trim(),
          owner: row.owner ? String(row.owner) : undefined,
          deadline: row.deadline ? String(row.deadline) : undefined,
        };
      }
      return { step: "" };
    })
    .filter((v) => v.step.length > 0)
    .map((v) => ({
      step: v.step,
      owner: v.owner || inferOwner(v.step),
      deadline: v.deadline || "2 weeks",
    }));
}

function asScoreEntry(value: unknown): { rating?: number; notes?: string } {
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const raw = row.rating ?? row.score ?? row.value;
    const rawStr = String(raw ?? "").replace("/10", "").trim();
    const parsed = rawStr ? Number(rawStr) : Number.NaN;
    const rating = Number.isFinite(parsed) ? Math.max(0, Math.min(10, Math.round(parsed))) : undefined;
    const notesRaw = row.notes ?? row.summary ?? row.rationale ?? row.detail;
    const notes = notesRaw != null ? String(notesRaw) : undefined;
    return { rating, notes };
  }
  if (typeof value === "number") {
    const rating = Math.max(0, Math.min(10, Math.round(value)));
    return { rating, notes: undefined };
  }
  if (typeof value === "string") {
    const s = value.trim();
    const parsed = Number(s.replace("/10", ""));
    if (Number.isFinite(parsed)) {
      const rating = Math.max(0, Math.min(10, Math.round(parsed)));
      return { rating, notes: undefined };
    }
    return { rating: undefined, notes: s || undefined };
  }
  return { rating: undefined, notes: undefined };
}

export function BriefView({ d }: { d: Brief | null }) {
  if (!d) return null;
  const money = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v ?? "").trim();
    if (!s) return null;
    const m = s.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0].replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const fmtMoney = (v: number | null) => (v == null ? "—" : `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  const safeText = (v: unknown): string => {
    if (v == null) return "—";
    if (typeof v === "string") return v || "—";
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.length ? v.map((x) => String(x)).join(", ") : "—";
    if (typeof v === "object") {
      try {
        return JSON.stringify(v);
      } catch {
        return "—";
      }
    }
    return String(v);
  };

  const tc = d.meta?.trust_contract;
  const quality = d.quality_contract || d.meta?.brief_quality;
  const missingSections = quality?.missing_sections || [];
  const showTrustBoundary = String(import.meta.env.VITE_SHOW_TRUST_BOUNDARY || "").toLowerCase() === "true";
  const rec = d.recommendation || {};
  const recConditions = asStringList(rec.conditions);
  const recNextSteps = asNextSteps(rec.next_steps);
  const contextConstraints = asStringList(d.context?.constraints);
  const decisionCriteria = asArray<Record<string, unknown>>(d.decision_criteria);
  const optionDimensions = asArray<Record<string, unknown>>(d.options_comparison?.dimensions);
  const pricingDetails = asArray<Record<string, unknown>>(d.cost_analysis?.pricing_details);
  const costOptions = asArray<Record<string, unknown>>(d.cost_analysis?.cost_options || d.cost_options);
  const costBasis = d.cost_analysis?.cost_basis;
  const costBasisCurrent = (costBasis?.current || {}) as Record<string, unknown>;
  const costBasisProposed = (costBasis?.proposed || {}) as Record<string, unknown>;
  const costBasisMissing = asArray<string>(costBasis?.missing);
  const costBasisAssumptionNotes = asStringList(costBasis?.assumption_notes);
  const costBasisExplicitComplete = Boolean(costBasis?.explicit_complete);
  const costBasisFoundationSource = String(costBasis?.foundation_source || "");
  const costBasisCoverage = typeof costBasis?.completeness_score === "number"
    ? Math.max(0, Math.min(100, Math.round(costBasis.completeness_score * 100)))
    : null;
  const hiddenCosts = asArray<Record<string, unknown>>(d.cost_analysis?.hidden_costs);
  const savingsOps = asArray<Record<string, unknown>>(d.cost_analysis?.savings_opportunities);
  const assumptions = asStringList(d.financial_assumptions?.assumptions);
  const parityFeatures = asArray<Record<string, unknown>>(d.feature_parity_validation?.critical_features);
  const parityUnresolved = asStringList(d.feature_parity_validation?.unresolved_gaps);
  const parityActions = asStringList(d.feature_parity_validation?.required_actions);
  const benchmarkRuns = asArray<Record<string, unknown>>(d.benchmark_validation?.benchmark_runs);
  const benchmarkActions = asStringList(d.benchmark_validation?.required_actions);
  const techDimensions = asArray<Record<string, unknown>>(d.technical_comparison?.dimensions);
  const failureModes = asArray<Record<string, unknown>>(d.architecture_review?.failure_modes);
  const sreRisks = asArray<Record<string, unknown>>(d.devops_sre_assessment?.sre_risks);
  const riskRegister = asArray<Record<string, unknown>>(d.risk_register);
  const alternatives = asArray<Record<string, unknown>>(d.alternatives);
  const roadmapPhases = asArray<Record<string, unknown>>(d.implementation_roadmap?.phases);
  const quickWins = asStringList(d.implementation_roadmap?.quick_wins);
  const optionNames = asStringList(d.options_comparison?.options).slice(0, 3);
  const hasThirdOption = optionNames.length >= 3 || optionDimensions.some((dim) => String(dim.option_c || dim.hybrid || dim.option_3 || "").trim().length > 0);
  const optionAName = optionNames[0] || "Option A";
  const optionBName = optionNames[1] || "Option B";
  const optionCName = optionNames[2] || "Option C";
  const currentMonthlyVal = d.cost_analysis?.current_state_monthly || d.financial_assumptions?.monthly_baseline;
  const proposedMonthlyVal = d.cost_analysis?.proposed_monthly || d.financial_assumptions?.monthly_baseline;
  const migrationVal = d.cost_analysis?.migration_one_time || d.financial_assumptions?.migration_cost;
  const tco3yVal = d.cost_analysis?.year_3_total || d.financial_assumptions?.tco_3y;
  const customTotals = d.cost_analysis?.custom_cost_estimate?.totals_usd;
  const sourceType = (d.cost_analysis?.source_type || {}) as Record<string, string>;
  const basisValue = (v: unknown): string => {
    const s = String(v ?? "").trim();
    return s.length > 0 ? s : "unknown";
  };
  const currentBasisLine = [
    `instance ${basisValue(costBasisCurrent.instance_type || costBasisCurrent.sku_or_tier || costBasisCurrent.tier)}`,
    `nodes ${basisValue(costBasisCurrent.node_count)}`,
    `storage ${basisValue(costBasisCurrent.storage_gb)} GB`,
    `region ${basisValue(costBasisCurrent.region)}`,
  ].join(" · ");
  const proposedUnits = costBasisProposed.search_units ?? costBasisProposed.replicas ?? costBasisProposed.partitions;
  const proposedBasisLine = [
    `tier ${basisValue(costBasisProposed.tier || costBasisProposed.sku_or_tier || costBasisProposed.instance_type)}`,
    `units ${basisValue(proposedUnits)}`,
    `storage ${basisValue(costBasisProposed.storage_gb)} GB`,
    `region ${basisValue(costBasisProposed.region)}`,
  ].join(" · ");
  const basisCurrentCriticalMissing = [costBasisCurrent.instance_type || costBasisCurrent.sku_or_tier || costBasisCurrent.tier, costBasisCurrent.node_count, costBasisCurrent.storage_gb, costBasisCurrent.region]
    .some((v) => String(v ?? "").trim().length === 0);
  const basisProposedCriticalMissing = [costBasisProposed.tier || costBasisProposed.sku_or_tier || costBasisProposed.instance_type, proposedUnits, costBasisProposed.storage_gb, costBasisProposed.region]
    .some((v) => String(v ?? "").trim().length === 0);
  const srcLabel = (key: string): string => {
    const v = String(sourceType[key] || "").toLowerCase();
    if (v === "web") return "web";
    if (v === "derived") return "derived";
    return "";
  };
  const withSource = (label: string, key: string): string => {
    const s = srcLabel(key);
    return s ? `${label} [${s}]` : label;
  };
  const featureArtifact = d.artifact_validation?.feature_inventory;
  const benchmarkArtifact = d.artifact_validation?.benchmark_report;
  const featureErrors = asStringList(featureArtifact?.errors);
  const benchmarkErrors = asStringList(benchmarkArtifact?.errors);
  const scalingModel = d.cost_analysis?.custom_cost_estimate?.scaling_model;
  const sensitivity3y = (scalingModel?.sensitivity_3y || {}) as Record<string, Record<string, unknown>>;
  const peopleOps = d.cost_analysis?.custom_cost_estimate?.people_ops_cost;
  const migrationExec = d.cost_analysis?.custom_cost_estimate?.migration_execution_cost;
  const totalEconomics3y = d.cost_analysis?.custom_cost_estimate?.total_economics_3y;
  const riskAdjusted3y = d.cost_analysis?.custom_cost_estimate?.risk_adjusted_3y;
  const growthRows = Object.entries(sensitivity3y).map(([k, v]) => {
    const current = money((v || {}).current_36_month);
    const proposed = money((v || {}).proposed_36_month);
    const delta = current != null && proposed != null ? current - proposed : null;
    return {
      key: k,
      current,
      proposed,
      delta,
      currentUnits: Number((v || {}).current_final_units || 0) || null,
      proposedUnits: Number((v || {}).proposed_final_units || 0) || null,
    };
  });
  const currentMonthlyNum = money(currentMonthlyVal);
  const proposedMonthlyNum = money(proposedMonthlyVal);
  const monthlyDelta = currentMonthlyNum != null && proposedMonthlyNum != null ? currentMonthlyNum - proposedMonthlyNum : null;
  const current24Num =
    money(customTotals?.current_24_month) ??
    money(d.cost_analysis?.current_24_total);
  const proposed24Num =
    money(customTotals?.proposed_24_month) ??
    money(d.cost_analysis?.month_24_total);
  const delta24Num = current24Num != null && proposed24Num != null ? current24Num - proposed24Num : null;
  const displayUsd = (v: unknown): string => {
    const n = money(v);
    return n == null ? "—" : fmtMoney(n);
  };

  const optionCell = (dim: Record<string, unknown>, idx: 0 | 1 | 2): string => {
    if (idx === 0) return String(dim.option_a || dim.current || dim.option_1 || "—");
    if (idx === 1) return String(dim.option_b || dim.proposed || dim.option_2 || "—");
    return String(dim.option_c || dim.hybrid || dim.option_3 || "—");
  };
  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {showTrustBoundary && (tc?.degraded_result || tc?.human_review_required_for_high_risk_adoption) && (
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

      {quality && (
        <Sec title="Brief Quality" icon="✓" defaultOpen>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 10 }}>
            <KV label="Completeness" value={`${quality.completeness_score ?? 0}/10`} mono />
            <KV label="Required Sections" value={String(quality.required_sections?.length ?? 0)} />
            <KV label="Missing Sections" value={String(missingSections.length)} color={missingSections.length > 0 ? T.rd : T.g} />
            <KV label="Recommendation Gate" value={quality.recommendation_gate_pass ? "PASS" : "BLOCKED"} color={quality.recommendation_gate_pass ? T.g : T.rd} />
          </div>
          {!quality.recommendation_gate_pass && (
            <div style={{ fontSize: 12, color: T.rd, marginBottom: 8 }}>
              Recommendation gate blocked: {quality.recommendation_gate_reason || "missing required decision sections"}.
            </div>
          )}
          {missingSections.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Missing sections</div>
              {missingSections.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {s}</div>
              ))}
            </div>
          )}
        </Sec>
      )}

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
          {!!contextConstraints.length && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Constraints</div>
              {contextConstraints.map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {c}</div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {!!decisionCriteria.length && (
        <Sec title="Decision Criteria" icon="3" defaultOpen>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Criteria", "Weight", "Why it matters"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{decisionCriteria.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(c.criterion || "—")}</td>
                  <td style={{ padding: 7, color: T.a, fontFamily: T.mn }}>{c.weight_pct ? `${String(c.weight_pct)}%` : "—"}</td>
                  <td style={{ padding: 7, color: T.m }}>{String(c.why_it_matters || "—")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {!!optionDimensions.length && (
        <Sec title="Options Compared" icon="4" defaultOpen>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Dimension", optionAName, optionBName, ...(hasThirdOption ? [optionCName] : []), "Assessment"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{optionDimensions.map((dim, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(dim.dimension || "—")}</td>
                  <td style={{ padding: 7, color: T.m }}>{optionCell(dim, 0)}</td>
                  <td style={{ padding: 7, color: T.m }}>{optionCell(dim, 1)}</td>
                  {hasThirdOption && <td style={{ padding: 7, color: T.m }}>{optionCell(dim, 2)}</td>}
                  <td style={{ padding: 7, color: T.d }}>{String(dim.assessment || "—")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      <Sec title="Decision Cost Comparison" icon="¢" defaultOpen>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 10 }}>
          <KV label={withSource("Current Monthly", "current_state_monthly")} value={String(currentMonthlyVal || "—")} mono />
          <KV label={withSource("Proposed Monthly", "proposed_monthly")} value={String(proposedMonthlyVal || "—")} mono />
          <KV label="Monthly Delta" value={monthlyDelta == null ? "—" : fmtMoney(monthlyDelta)} mono color={monthlyDelta != null && monthlyDelta >= 0 ? T.g : T.rd} />
          <KV label="24-Month Current" value={current24Num == null ? "—" : fmtMoney(current24Num)} mono />
          <KV label="24-Month Proposed" value={proposed24Num == null ? "—" : fmtMoney(proposed24Num)} mono />
          <KV label="24-Month Delta" value={delta24Num == null ? "—" : fmtMoney(delta24Num)} mono color={delta24Num != null && delta24Num >= 0 ? T.g : T.rd} />
          <KV label={withSource("Migration One-Time", "migration_one_time")} value={String(migrationVal || "—")} mono />
          <KV label={withSource("3-Year TCO", "year_3_total")} value={String(tco3yVal || "—")} mono />
        </div>
        {(Object.keys(costBasisCurrent).length > 0 || Object.keys(costBasisProposed).length > 0) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>
              Current monthly basis: <span style={{ color: T.t, fontFamily: T.mn }}>{currentBasisLine}</span>
            </div>
            <div style={{ fontSize: 11, color: T.d }}>
              Proposed monthly basis: <span style={{ color: T.t, fontFamily: T.mn }}>{proposedBasisLine}</span>
            </div>
          </div>
        )}
        {(basisCurrentCriticalMissing || basisProposedCriticalMissing) && (
          <div style={{ fontSize: 12, color: T.rd, marginBottom: 8 }}>
            Cost basis is incomplete. Monthly estimates are not fully justified until tier/instance, capacity units, storage, and region are all populated.
          </div>
        )}
        {!costBasisExplicitComplete && (
          <div style={{ fontSize: 12, color: T.rd, marginBottom: 8 }}>
            Calculator-grade cost foundation missing. Provide explicit `current_stack_config` and `proposed_stack_config` (instance/tier, nodes or units, storage, region) with shared workload assumptions.
            {costBasisFoundationSource ? ` current_source=${costBasisFoundationSource}.` : ""}
          </div>
        )}
        {monthlyDelta == null && (
          <div style={{ fontSize: 12, color: T.d }}>
            Monthly delta unavailable: current/proposed values are incomplete in this run.
          </div>
        )}
        {costOptions.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn, marginBottom: 8 }}>
              IMPLEMENTATION COST OPTIONS
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Provider", "Service", "Tier/Plan", "Capacity", "Region", "Unit Price", "Estimated Monthly", "Source"].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costOptions.slice(0, 18).map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                      <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{safeText(r.provider)}</td>
                      <td style={{ padding: 7, color: T.m }}>{safeText(r.service)}</td>
                      <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{safeText(r.tier_or_plan)}</td>
                      <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{safeText(r.capacity_units)}</td>
                      <td style={{ padding: 7, color: T.d, fontFamily: T.mn }}>{safeText(r.region)}</td>
                      <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{displayUsd(r.unit_price_usd)}</td>
                      <td style={{ padding: 7, color: T.a, fontFamily: T.mn, fontWeight: 700 }}>{displayUsd(r.estimated_monthly_usd)}</td>
                      <td style={{ padding: 7, color: T.d, maxWidth: 220, wordBreak: "break-all" }}>{safeText(r.source)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Sec>

      {/* Cost */}
      {d.cost_analysis && (
        <Sec title="Cost & Financial Analysis" icon="$">
          {d.cost_analysis.foundation_status && (
            <div style={{ fontSize: 12, color: String(d.cost_analysis.foundation_status).startsWith("COMPLETE") ? T.g : T.rd, margin: "0 0 8px" }}>
              Cost status: {String(d.cost_analysis.foundation_status)}
            </div>
          )}
          <p style={{ fontSize: 13, color: T.m, lineHeight: 1.7, margin: "0 0 14px" }}>{safeText(d.cost_analysis.narrative)}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 14 }}>
            <KV label={withSource("Current Monthly", "current_state_monthly")} value={d.cost_analysis.current_state_monthly} mono color={T.m} />
            <KV label={withSource("Proposed Monthly", "proposed_monthly")} value={d.cost_analysis.proposed_monthly} mono color={T.a} />
            <KV label={withSource("Year 1", "year_1_total")} value={d.cost_analysis.year_1_total} mono />
            <KV label="24-Month Proposed" value={d.cost_analysis.month_24_total || (proposed24Num == null ? "—" : fmtMoney(proposed24Num))} mono />
            <KV label={withSource("Year 3", "year_3_total")} value={d.cost_analysis.year_3_total} mono />
            <KV label={withSource("Migration", "migration_one_time")} value={d.cost_analysis.migration_one_time} mono color={T.o} />
            <KV label="ROI" value={d.cost_analysis.roi_timeline} />
          </div>
          {(d.cost_analysis.current_cost_breakdown || d.cost_analysis.proposed_cost_breakdown) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {d.cost_analysis.current_cost_breakdown && (
                <div style={{ padding: "10px 12px", border: `1px solid ${T.b}`, borderRadius: 8, background: T.s }}>
                  <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>CURRENT COST BREAKDOWN</div>
                  <KV label="Monthly baseline" value={String(d.cost_analysis.current_cost_breakdown.monthly_baseline || "—")} mono />
                  {Object.entries(d.cost_analysis.current_cost_breakdown.components || {}).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>
                      {k}: <span style={{ color: T.t, fontFamily: T.mn }}>{String(v)}</span>
                    </div>
                  ))}
                  {d.cost_analysis.current_cost_breakdown.data_source && (
                    <div style={{ fontSize: 10, color: T.d, marginTop: 6 }}>Source: {d.cost_analysis.current_cost_breakdown.data_source}</div>
                  )}
                </div>
              )}
              {d.cost_analysis.proposed_cost_breakdown && (
                <div style={{ padding: "10px 12px", border: `1px solid ${T.b}`, borderRadius: 8, background: T.s }}>
                  <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>PROPOSED COST BREAKDOWN</div>
                  <KV label="Monthly baseline" value={String(d.cost_analysis.proposed_cost_breakdown.monthly_baseline || "—")} mono />
                  {Object.entries(d.cost_analysis.proposed_cost_breakdown.components || {}).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>
                      {k}: <span style={{ color: T.t, fontFamily: T.mn }}>{String(v)}</span>
                    </div>
                  ))}
                  {d.cost_analysis.proposed_cost_breakdown.data_source && (
                    <div style={{ fontSize: 10, color: T.d, marginTop: 6 }}>Source: {d.cost_analysis.proposed_cost_breakdown.data_source}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {(d.cost_analysis.migration_cost || d.cost_analysis["3_year_tco"] || d.cost_analysis.break_even_month) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <KV
                label="Migration Total"
                value={String(d.cost_analysis.migration_cost?.total || d.cost_analysis.migration_one_time || "—")}
                mono
              />
              <KV
                label="3Y TCO Savings"
                value={String(d.cost_analysis["3_year_tco"]?.savings || "—")}
                mono
                color={T.g}
              />
              <KV
                label="Break-even Month"
                value={String(d.cost_analysis.break_even_month || "—")}
                mono
              />
            </div>
          )}
          {(Object.keys(costBasisCurrent).length > 0 || Object.keys(costBasisProposed).length > 0) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn }}>COST BASIS & SIZING INPUTS</div>
                <div style={{ fontSize: 11, color: costBasisCoverage != null && costBasisCoverage >= 60 ? T.g : T.y, fontFamily: T.mn }}>
                  Coverage: {costBasisCoverage == null ? "—" : `${costBasisCoverage}%`}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "10px 12px", border: `1px solid ${T.b}`, borderRadius: 8, background: T.s }}>
                  <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>CURRENT BASIS (AWS/OpenSearch)</div>
                  <KV label="Instance Type" value={String(costBasisCurrent.instance_type || "unknown")} mono />
                  <KV label="Node Count" value={String(costBasisCurrent.node_count || "unknown")} mono />
                  <KV label="Storage (GB)" value={String(costBasisCurrent.storage_gb || "unknown")} mono />
                  <KV label="Region" value={String(costBasisCurrent.region || "unknown")} mono />
                </div>
                <div style={{ padding: "10px 12px", border: `1px solid ${T.b}`, borderRadius: 8, background: T.s }}>
                  <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>PROPOSED BASIS (Azure AI Search)</div>
                  <KV label="Tier" value={String(costBasisProposed.tier || costBasisProposed.sku_or_tier || "unknown")} mono />
                  <KV
                    label="Capacity Units"
                    value={String(costBasisProposed.search_units || costBasisProposed.replicas || costBasisProposed.partitions || "unknown")}
                    mono
                  />
                  <KV label="Storage (GB)" value={String(costBasisProposed.storage_gb || "unknown")} mono />
                  <KV label="Region" value={String(costBasisProposed.region || "unknown")} mono />
                </div>
              </div>
              {costBasisMissing.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: T.y }}>
                  Missing basis fields: {costBasisMissing.join(", ")}
                </div>
              )}
              {costBasisAssumptionNotes.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Basis assumptions</div>
                  {costBasisAssumptionNotes.slice(0, 4).map((n, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.m, padding: "2px 0" }}>• {n}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {growthRows.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn, marginBottom: 8 }}>
                GROWTH SENSITIVITY (3Y)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      {["Scenario", "Current 3Y", "Proposed 3Y", "Delta", "Units (Current→Proposed)", "Winner"].map((h, i) => (
                        <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {growthRows.map((r, i) => {
                      const winner = r.delta == null ? "—" : (r.delta >= 0 ? "Proposed" : "Current");
                      const scenarioLabel = r.key
                        .replace(/_/g, " ")
                        .replace("3y", "3Y")
                        .replace("2x", "2x")
                        .replace("5x", "5x");
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                          <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{scenarioLabel}</td>
                          <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{r.current == null ? "—" : fmtMoney(r.current)}</td>
                          <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{r.proposed == null ? "—" : fmtMoney(r.proposed)}</td>
                          <td style={{ padding: 7, color: r.delta != null && r.delta >= 0 ? T.g : T.rd, fontFamily: T.mn, fontWeight: 700 }}>
                            {r.delta == null ? "—" : fmtMoney(r.delta)}
                          </td>
                          <td style={{ padding: 7, color: T.d, fontFamily: T.mn }}>
                            {(r.currentUnits || "—")} → {(r.proposedUnits || "—")}
                          </td>
                          <td style={{ padding: 7 }}>
                            <Badge color={winner === "Proposed" ? T.g : winner === "Current" ? T.rd : T.m} bg={T.s}>{winner}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(peopleOps || migrationExec || totalEconomics3y || riskAdjusted3y) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn, marginBottom: 8 }}>
                TOTAL ECONOMIC PICTURE
              </div>
              {peopleOps && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                  <KV label="Ops Rate ($/h)" value={fmtMoney(money(peopleOps.hourly_rate_usd))} mono />
                  <KV label="Ops Hours Current/mo" value={String(peopleOps.current_hours_monthly ?? "—")} mono />
                  <KV label="Ops Hours Proposed/mo" value={String(peopleOps.proposed_hours_monthly ?? "—")} mono />
                  <KV label="People Delta/mo" value={fmtMoney(money(peopleOps.monthly_delta_usd))} mono color={(money(peopleOps.monthly_delta_usd) ?? 0) >= 0 ? T.g : T.rd} />
                </div>
              )}
              {migrationExec && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                  <KV label="Migration Hours (L/B/H)" value={`${String(migrationExec.hours_low ?? "—")}/${String(migrationExec.hours_base ?? "—")}/${String(migrationExec.hours_high ?? "—")}`} mono />
                  <KV label="Migration Cost Low" value={fmtMoney(money(migrationExec.cost_low_usd))} mono />
                  <KV label="Migration Cost Base" value={fmtMoney(money(migrationExec.cost_base_usd))} mono />
                  <KV label="Migration Cost High" value={fmtMoney(money(migrationExec.cost_high_usd))} mono />
                </div>
              )}
              {totalEconomics3y && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                  <KV label="3Y Total Current" value={fmtMoney(money(totalEconomics3y.total_current_usd))} mono />
                  <KV label="3Y Total Proposed" value={fmtMoney(money(totalEconomics3y.total_proposed_usd))} mono />
                  <KV label="3Y Total Delta" value={fmtMoney(money(totalEconomics3y.delta_usd))} mono color={(money(totalEconomics3y.delta_usd) ?? 0) >= 0 ? T.g : T.rd} />
                </div>
              )}
              {riskAdjusted3y && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr>
                        {["Risk Scenario", "Proposed 3Y", "Current Baseline 3Y", "Delta", "Notes"].map((h, i) => (
                          <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(["low", "base", "high"] as const).map((k, i) => {
                        const row = (riskAdjusted3y as Record<string, unknown>)[k] as Record<string, unknown> | undefined;
                        const proposed = money(row?.proposed_total_usd);
                        const current = money(riskAdjusted3y.current_baseline_usd);
                        const delta = current != null && proposed != null ? current - proposed : null;
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                            <td style={{ padding: 7, color: T.t, fontWeight: 600, textTransform: "capitalize" }}>{k}</td>
                            <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{proposed == null ? "—" : fmtMoney(proposed)}</td>
                            <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{current == null ? "—" : fmtMoney(current)}</td>
                            <td style={{ padding: 7, color: delta != null && delta >= 0 ? T.g : T.rd, fontFamily: T.mn, fontWeight: 700 }}>{delta == null ? "—" : fmtMoney(delta)}</td>
                            <td style={{ padding: 7, color: T.d }}>{String(row?.notes || "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {pricingDetails.length > 0 && (
            <>
              <div style={{ fontSize: 9, color: T.a, fontWeight: 700, letterSpacing: "0.12em", fontFamily: T.mn, marginBottom: 8 }}>VERIFIED PRICING</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr>{["Service", "Tier", "Unit Price", "Usage", "Monthly", "↗"].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{pricingDetails.map((p, i) => {
                    const source = (p as Record<string, unknown>).source as string | undefined;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                        <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(p.service || "—")}</td>
                        <td style={{ padding: 7, color: T.m, fontFamily: T.mn, fontSize: 10 }}>{String(p.sku_or_tier || "—")}</td>
                        <td style={{ padding: 7, color: T.m, fontFamily: T.mn }}>{String(p.unit_price || "—")}</td>
                        <td style={{ padding: 7, color: T.m }}>{String(p.estimated_usage || "—")}</td>
                        <td style={{ padding: 7, color: T.a, fontFamily: T.mn, fontWeight: 700 }}>{String(p.monthly_cost || "—")}</td>
                        <td style={{ padding: 7 }}>
                          {source ? (
                            <a
                              href={source}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: T.d, fontSize: 9, textDecoration: "none" }}
                            >
                              ↗
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {hiddenCosts.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>HIDDEN COSTS</div>
                {hiddenCosts.map((c, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.m, padding: "3px 0", borderBottom: `1px solid ${T.b}` }}>
                    <strong style={{ color: T.t }}>{String(c.item || "—")}</strong> <span style={{ color: T.rd, fontFamily: T.mn }}>({String(c.estimated || "—")})</span>
                  </div>
                ))}
              </div>
            )}
            {savingsOps.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: T.g, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>SAVINGS</div>
                {savingsOps.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.m, padding: "3px 0", borderBottom: `1px solid ${T.b}` }}>
                    <strong style={{ color: T.t }}>{String(s.opportunity || "—")}</strong> — <span style={{ color: T.g, fontFamily: T.mn }}>{String(s.potential_savings || "—")}</span>
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
            <KV label="Monthly baseline" value={safeText(d.financial_assumptions.monthly_baseline)} mono />
            <KV label="Migration cost" value={safeText(d.financial_assumptions.migration_cost)} mono />
            <KV label="3-year TCO" value={safeText(d.financial_assumptions.tco_3y)} mono />
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
          {!!assumptions.length && (
            <div style={{ marginTop: 8 }}>
              {assumptions.map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {a}</div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {(d.feature_parity_validation || d.benchmark_validation) && (
        <Sec title="Migration Readiness Gates" icon="6" defaultOpen>
          {d.feature_parity_validation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>
                Feature Parity Gate: <span style={{ color: String(d.feature_parity_validation.gate_status || "").toLowerCase() === "pass" ? T.g : T.rd }}>{String(d.feature_parity_validation.gate_status || "unknown").toUpperCase()}</span>
              </div>
              {parityFeatures.length > 0 && (
                <div style={{ overflowX: "auto", marginBottom: 6 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr>{["Feature", "Current", "Proposed", "Risk", "Mitigation"].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{parityFeatures.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                        <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(r.feature || "—")}</td>
                        <td style={{ padding: 7, color: T.m }}>{String(r.current_support || "—")}</td>
                        <td style={{ padding: 7, color: T.m }}>{String(r.proposed_support || "—")}</td>
                        <td style={{ padding: 7, color: ({ high: T.rd, medium: T.y, low: T.g } as Record<string, string>)[String(r.gap_risk || "").toLowerCase()] || T.d, fontFamily: T.mn }}>{String(r.gap_risk || "—")}</td>
                        <td style={{ padding: 7, color: T.d }}>{String(r.mitigation || "—")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {parityUnresolved.length > 0 && (
                <div style={{ fontSize: 11, color: T.y, marginBottom: 4 }}>Unresolved gaps: {parityUnresolved.join(", ")}</div>
              )}
              {parityActions.map((a, i) => (
                <div key={i} style={{ fontSize: 11, color: T.m, padding: "1px 0" }}>• {a}</div>
              ))}
              {featureErrors.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: T.rd, marginBottom: 2 }}>Artifact validation errors:</div>
                  {featureErrors.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.rd }}>• {e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {d.benchmark_validation && (
            <div>
              <div style={{ fontSize: 10, color: T.d, fontFamily: T.mn, marginBottom: 6 }}>
                Benchmark Gate: <span style={{ color: String(d.benchmark_validation.gate_status || "").toLowerCase() === "pass" ? T.g : T.rd }}>{String(d.benchmark_validation.gate_status || "unknown").toUpperCase()}</span>
              </div>
              {benchmarkRuns.length > 0 && (
                <div style={{ overflowX: "auto", marginBottom: 6 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr>{["Scenario", "Dataset", "Target SLO", "Result"].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "5px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>{benchmarkRuns.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                        <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(r.scenario || "—")}</td>
                        <td style={{ padding: 7, color: T.m }}>{String(r.dataset_size_docs || "—")} docs</td>
                        <td style={{ padding: 7, color: T.m }}>{String(r.target_slo || "—")}</td>
                        <td style={{ padding: 7, color: String(r.result || "").toLowerCase() === "pass" ? T.g : T.y, fontFamily: T.mn }}>{String(r.result || "—")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {benchmarkActions.map((a, i) => (
                <div key={i} style={{ fontSize: 11, color: T.m, padding: "1px 0" }}>• {a}</div>
              ))}
              {benchmarkErrors.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: T.rd, marginBottom: 2 }}>Artifact validation errors:</div>
                  {benchmarkErrors.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.rd }}>• {e}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ features: [{ feature: "custom analyzer/token filters", current_support: "used", proposed_support: "partial", gap_risk: "high", mitigation: "map equivalent and validate" }] }, null, 2))}`}
                  download="feature_inventory.template.json"
                  style={{ fontSize: 11, color: T.a, textDecoration: "none" }}
                >
                  Download Feature Template
                </a>
                <a
                  href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ runs: [{ scenario: "50k baseline", dataset_size_docs: "50000", query_mix: "prod representative", p95_ms: 95, p99_ms: 165, target_p99_ms: 200, throughput_qps: 120 }] }, null, 2))}`}
                  download="benchmark_report.template.json"
                  style={{ fontSize: 11, color: T.a, textDecoration: "none" }}
                >
                  Download Benchmark Template
                </a>
                <span style={{ fontSize: 11, color: T.d }}>
                  Re-run with uploaded artifacts from Intake to clear blocked migration gates.
                </span>
              </div>
            </div>
          )}
        </Sec>
      )}

      {/* Technical Comparison */}
      {techDimensions.length > 0 && (
        <Sec title="Technical Comparison" icon="⇔">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["Dimension", "Current", "Proposed", "Assessment", ""].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "6px 7px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{techDimensions.map((dim, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 7, color: T.t, fontWeight: 600 }}>{String(dim.dimension || "—")}</td>
                  <td style={{ padding: 7, color: T.m, maxWidth: 170 }}>{String(dim.current || "—")}</td>
                  <td style={{ padding: 7, color: T.m, maxWidth: 170 }}>{String(dim.proposed || "—")}</td>
                  <td style={{ padding: 7, color: T.d, fontSize: 11 }}>{String(dim.assessment || "—")}</td>
                  <td style={{ padding: 7 }}><WTag w={String(dim.winner || "")} /></td>
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
          {d.architecture_review.scores && Object.entries(d.architecture_review.scores).map(([k, v]) => {
            const score = asScoreEntry(v);
            return (
              <Bar
                key={k}
                score={score.rating}
                label={k.charAt(0).toUpperCase() + k.slice(1)}
                sub={score.notes}
              />
            );
          })}
          {failureModes.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 6 }}>FAILURE MODES</div>
              {failureModes.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
                  <Dot l={String(f.impact || "")} />
                  <div><span style={{ color: T.t, fontWeight: 600 }}>{String(f.scenario || "—")}</span> — <span style={{ color: T.d }}>{String(f.mitigation || "—")}</span></div>
                </div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {/* Strategic */}
      {d.strategic_assessment && (
        <Sec title="Strategic Assessment" icon="◆" defaultOpen={false}>
          {(() => {
            const baScore = d.strategic_assessment?.business_alignment?.score;
            const orScore = d.strategic_assessment?.organizational_readiness?.score;
            const lockIn = d.strategic_assessment?.vendor_lock_in?.risk_level;
            const ttv = d.strategic_assessment?.time_to_value?.estimate;
            return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <KV label="Business Alignment" value={baScore != null ? `${baScore}/10` : "—"} />
            <KV label="Time to Value" value={ttv || "—"} />
            <KV label="Org Readiness" value={orScore != null ? `${orScore}/10` : "—"} />
            <KV label="Vendor Lock-in" value={lockIn || "—"} color={({ CRITICAL: T.rd, HIGH: T.o, MEDIUM: T.y, LOW: T.g } as Record<string, string>)[lockIn ?? ""]} />
          </div>
            );
          })()}
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
          {sreRisks.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: T.rD, borderRadius: 6, border: "1px solid rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize: 9, color: T.rd, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>SRE RISKS</div>
              {sreRisks.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0", fontSize: 12 }}>
                  <Dot l={String(r.severity || "")} /><span style={{ color: T.t }}>{String(r.risk || "—")}</span>
                </div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {/* Risk Register */}
      {riskRegister.length > 0 && (
        <Sec title="Risk Register" icon="⚠" defaultOpen={false}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr>{["ID", "Cat", "Risk", "Score", "Mitigation", "Owner"].map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "5px 6px", borderBottom: `2px solid ${T.b}`, color: T.d, fontSize: 9, fontFamily: T.mn, fontWeight: 700 }}>{h}</th>
              ))}</tr></thead>
              <tbody>{riskRegister.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.b}` }}>
                  <td style={{ padding: 6, fontFamily: T.mn, color: T.d }}>{String(r.id || "—")}</td>
                  <td style={{ padding: 6 }}><Badge color={T.m} bg={T.s}>{String(r.category || "").slice(0, 5)}</Badge></td>
                  <td style={{ padding: 6, color: T.t, maxWidth: 180 }}>{String(r.risk || "—")}</td>
                  <td style={{ padding: 6, fontFamily: T.mn, fontWeight: 700, color: (Number(r.risk_score) || 0) >= 15 ? T.rd : (Number(r.risk_score) || 0) >= 9 ? T.y : T.g }}>{String(r.risk_score || "—")}</td>
                  <td style={{ padding: 6, color: T.d, maxWidth: 180 }}>{String(r.mitigation || "—")}</td>
                  <td style={{ padding: 6, color: T.d }}>{String(r.owner || "—")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Sec>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <Sec title="Alternatives" icon="⇔" defaultOpen={false}>
          {alternatives.map((alt, i) => (
            <div key={i} style={{ background: T.s, padding: 14, borderRadius: 8, border: `1px solid ${T.b}`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.t }}>{String(alt.name || "Alternative")}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Badge color={T.m} bg={T.r}>{String(alt.cost_vs_proposed || "—")}</Badge>
                  <Badge color={T.m} bg={T.r}>{String(alt.timeline_vs_proposed || "—")}</Badge>
                </div>
              </div>
              <p style={{ fontSize: 12, color: T.m, margin: "0 0 8px", lineHeight: 1.6 }}>{String(alt.approach || "—")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>{asStringList(alt.pros).map((p, j) => <div key={j} style={{ fontSize: 11, color: T.g, padding: "1px 0" }}>+ {p}</div>)}</div>
                <div>{asStringList(alt.cons).map((c, j) => <div key={j} style={{ fontSize: 11, color: T.rd, padding: "1px 0" }}>− {c}</div>)}</div>
              </div>
              {(() => {
                const when = String((alt as Record<string, unknown>).when_to_prefer ?? "").trim();
                return when
                  ? <div style={{ marginTop: 6, fontSize: 11, color: T.a, fontStyle: "italic" }}>→ Best when: {when}</div>
                  : null;
              })()}
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
            {roadmapPhases.map((p, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 18 }}>
                <div style={{ position: "absolute", left: -18, top: 4, width: 10, height: 10, borderRadius: "50%", background: T.a, border: `2px solid ${T.r}` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.t }}>{String(p.name || `Phase ${i + 1}`)}</span>
                  <span style={{ fontSize: 11, color: T.a, fontFamily: T.mn, fontWeight: 600 }}>{String(p.duration || "—")}</span>
                </div>
                {asStringList(p.deliverables).map((del, j) => <div key={j} style={{ fontSize: 12, color: T.m, padding: "1px 0" }}>→ {del}</div>)}
                {(() => {
                  const gate = String((p as Record<string, unknown>).gate_criteria ?? "").trim();
                  return gate
                    ? <div style={{ fontSize: 11, color: T.y, marginTop: 3 }}>Gate: {gate}</div>
                    : null;
                })()}
              </div>
            ))}
          </div>
          {quickWins.length > 0 && (
            <div style={{ padding: "8px 12px", background: T.gD, borderRadius: 6, border: "1px solid rgba(52,211,153,0.12)", marginTop: 8 }}>
              <div style={{ fontSize: 9, color: T.g, fontWeight: 700, fontFamily: T.mn, marginBottom: 4 }}>QUICK WINS</div>
              {quickWins.map((w, i) => <div key={i} style={{ fontSize: 12, color: "rgba(52,211,153,0.8)" }}>✓ {w}</div>)}
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
            <GBadge v={rec.decision} />
          </div>
          <p style={{ fontSize: 14, color: T.t, lineHeight: 1.7, margin: "0 0 14px", fontWeight: 500, position: "relative" }}>{rec.rationale}</p>
          {recConditions.length > 0 && (
            <div style={{ marginBottom: 12, position: "relative" }}>
              <div style={{ fontSize: 9, color: T.y, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>CONDITIONS</div>
              {recConditions.map((c, i) => <div key={i} style={{ fontSize: 12, color: "rgba(251,191,36,0.8)", padding: "2px 0" }}>⚬ {c}</div>)}
            </div>
          )}
          <div style={{ marginBottom: 12, position: "relative" }}>
            <div style={{ fontSize: 9, color: T.d, fontWeight: 700, fontFamily: T.mn, marginBottom: 5 }}>NEXT STEPS</div>
            {recNextSteps.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
                <span style={{ color: T.t }}>{i + 1}. {s.step}</span>
                <span style={{ color: T.d, whiteSpace: "nowrap", marginLeft: 10 }}>{s.owner || "Owner TBD"} · {s.deadline || "TBD"}</span>
              </div>
            ))}
            {recNextSteps.length === 0 && (
              <div style={{ fontSize: 12, color: T.d }}>—</div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative" }}>
            <div style={{ padding: "9px 12px", background: T.s, borderRadius: 6, border: `1px solid ${T.b}` }}>
              <div style={{ fontSize: 9, color: T.d, fontFamily: T.mn, marginBottom: 2 }}>DEADLINE</div>
              <div style={{ fontSize: 12, color: T.t, fontWeight: 600 }}>{rec.decision_deadline || "—"}</div>
            </div>
            <div style={{ padding: "9px 12px", background: T.rD, borderRadius: 6, border: "1px solid rgba(248,113,113,0.12)" }}>
              <div style={{ fontSize: 9, color: T.rd, fontFamily: T.mn, marginBottom: 2 }}>COST OF DELAY</div>
              <div style={{ fontSize: 12, color: "rgba(248,113,113,0.9)" }}>{rec.what_happens_if_we_wait || "—"}</div>
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
          ] as [string, unknown][]).map(([title, items], i) => {
            const normalized = asStringList(items);
            return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.d, marginBottom: 4 }}>{title}</div>
              {normalized.length ? (
                normalized.map((it, j) => <div key={j} style={{ fontSize: 12, color: T.m, padding: "2px 0" }}>• {it}</div>)
              ) : (
                <div style={{ fontSize: 12, color: T.d }}>—</div>
              )}
            </div>
            );
          })}
        </Sec>
      )}
    </div>
  );
}
