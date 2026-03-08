import { T, S } from "../lib/theme";
import type { Brief } from "../types";

function row(label: string, value: string | number | boolean | undefined) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.b}` }}>
      <span style={{ fontSize: 11, color: T.d }}>{label}</span>
      <span style={{ fontSize: 12, color: T.t }}>{value == null || value === "" ? "—" : String(value)}</span>
    </div>
  );
}

export function RunMetadataView({ d }: { d: Brief | null }) {
  if (!d) return null;
  const policy = d.meta?.policy;
  const m = d.meta?.run_metrics;
  const g = d.meta?.guarantees;
  const l = d.meta?.lineage;
  const rf = d.meta?.replay_fidelity;
  const tc = d.meta?.trust_contract;
  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Run Metadata</h3>
      {row("Policy tier", policy?.tier)}
      {row("Policy mode", policy?.mode)}
      {row("Workflow path", policy?.path)}
      {row("Policy enforced", policy?.enforced)}
      {row("Enforced full", policy?.enforced_full)}
      {row("Selection reason", policy?.selection_reason)}
      {row("Elapsed (ms)", m?.elapsed_ms)}
      {row("Stage failures", m?.stage_failures)}
      {row("Specialists available", m?.specialists_available)}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: T.d, marginBottom: 6 }}>Enforced constraints</div>
        {(policy?.constraints || []).length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(policy?.constraints || []).map((c, i) => (
              <span key={i} style={{ fontSize: 11, color: T.a, border: `1px solid ${T.aB}`, background: T.aD, borderRadius: 999, padding: "3px 8px" }}>
                {c}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.m }}>No policy constraints recorded for this run.</div>
        )}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: T.d, marginBottom: 6 }}>Operational Guarantees</div>
        {row("Guarantee pass", g?.pass)}
        {row("Guarantee tier", g?.risk_tier)}
        {Array.isArray(g?.violations) && g?.violations.length > 0 && (
          <div style={{ marginTop: 6 }}>
            {g.violations.map((v, i) => (
              <div key={i} style={{ fontSize: 12, color: T.rd, padding: "2px 0" }}>• {v}</div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: T.d, marginBottom: 6 }}>Lineage</div>
        {row("Run ID", l?.run_id)}
        {row("Parent run", l?.parent_run_id || undefined)}
        {row("Checkpoint ID", l?.checkpoint_id || undefined)}
        {row("Policy version", l?.policy_version)}
        {row("Schema version", l?.schema_version)}
        {row("Prompt bundle", l?.prompt_bundle_version)}
        {row("Source snapshot", l?.source_snapshot_id)}
        {row("Input context hash", l?.input_context_hash)}
        {row("Scenario ID", l?.scenario_id)}
        {row("Scenario parent", l?.scenario_parent_run_id || undefined)}
        {row("Review state", l?.review_state)}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: T.d, marginBottom: 6 }}>Replay Fidelity</div>
        {row("Replay mode", rf?.mode)}
        {row("Replay status", rf?.status)}
        {row("Tool cache hits", rf?.tool_hits)}
        {row("Tool cache misses", rf?.tool_misses)}
        {row("Tool calls recorded", rf?.tool_recorded)}
        {row("LLM cache hits", rf?.llm_hits)}
        {row("LLM cache misses", rf?.llm_misses)}
        {row("LLM calls recorded", rf?.llm_recorded)}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: T.d, marginBottom: 6 }}>Trust Contract</div>
        {row("Advisory output", tc?.advisory_not_authoritative)}
        {row("Governance legal cert", tc?.governance_not_legal_certification === true ? "No" : undefined)}
        {row("Degraded result", tc?.degraded_result)}
        {row("Degraded implies approval", tc?.degraded_not_approval === true ? "No" : undefined)}
        {row("Governance pass", tc?.governance_pass)}
        {row("Human review required", tc?.human_review_required_for_high_risk_adoption)}
      </div>
    </div>
  );
}
