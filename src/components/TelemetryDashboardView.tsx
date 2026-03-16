import { useEffect, useMemo, useState } from "react";
import { T, S } from "../lib/theme";

type Mode = "overview" | "fleet";

type Overview = {
  total_runs?: number;
  tiers?: Record<string, Record<string, number | string>>;
  alerts?: Array<{ severity?: string; tier?: string; code?: string; value?: number }>;
  recent_runs?: Array<{
    run_id?: string;
    tier?: string;
    status?: string;
    cost_usd_estimate?: number;
    elapsed_ms?: number;
    fallback_events?: number;
  }>;
};

type Fleet = {
  queue?: {
    depth_total?: number;
    depth_by_priority?: Record<string, number>;
    state_counts?: Record<string, number>;
  };
  stuck_tasks?: {
    count?: number;
    threshold_seconds?: number;
    items?: Array<{
      task_id?: string;
      state?: string;
      priority?: string;
      owner_agent?: string;
      attempt_count?: number;
      lease_owner?: string;
      lease_until?: number;
      updated_at?: string;
    }>;
  };
  retries?: {
    tasks_with_retry?: number;
    retrying_now?: number;
    failed_after_retries?: number;
    avg_attempt_count?: number;
  };
  fallback_rate?: {
    completed_runs?: number;
    fallback_runs?: number;
    rate?: number;
  };
  approval_latency?: {
    resolved_count?: number;
    avg_seconds?: number;
    p95_seconds?: number;
  };
  cost_per_completed_decision?: {
    value_usd?: number;
    instrumented_value_usd?: number;
    completed_runs?: number;
    instrumented_runs?: number;
    cost_total_usd?: number;
  };
};

const tenantId = import.meta.env.VITE_TENANT_ID || "local-dev";

type Severity = "good" | "warn" | "bad";

function severityStyle(level: Severity) {
  if (level === "bad") {
    return { border: T.rd, bg: T.rD, fg: T.rd, label: "Critical" };
  }
  if (level === "warn") {
    return { border: T.y, bg: T.yD, fg: T.y, label: "Watch" };
  }
  return { border: T.g, bg: T.gD, fg: T.g, label: "Healthy" };
}

function metricSeverity(value: number, warnAt: number, badAt: number): Severity {
  if (value >= badAt) return "bad";
  if (value >= warnAt) return "warn";
  return "good";
}

function MetricCard(props: { title: string; value: string; sub: string; severity: Severity }) {
  const style = severityStyle(props.severity);
  return (
    <div style={{ border: `1px solid ${style.border}`, borderRadius: 10, padding: 10, background: style.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 11, color: T.d }}>{props.title}</div>
        <span style={{ fontSize: 10, color: style.fg, border: `1px solid ${style.border}`, background: "#FFFFFF", borderRadius: 999, padding: "2px 8px" }}>
          {style.label}
        </span>
      </div>
      <div style={{ fontSize: 18, color: T.t, fontWeight: 700, marginTop: 4 }}>{props.value}</div>
      <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn, marginTop: 4 }}>{props.sub}</div>
    </div>
  );
}

function MiniTrend(props: { title: string; values: number[]; formatter?: (v: number) => string }) {
  const vals = props.values.filter((v) => Number.isFinite(v));
  const max = vals.length ? Math.max(...vals, 1) : 1;
  const latest = vals.length ? vals[vals.length - 1] : 0;

  return (
    <div style={{ border: `1px solid ${T.b}`, borderRadius: 10, padding: 10, background: T.bg }}>
      <div style={{ fontSize: 11, color: T.d }}>{props.title}</div>
      <div style={{ marginTop: 8, height: 44, display: "flex", alignItems: "flex-end", gap: 3 }}>
        {vals.slice(-18).map((v, idx) => (
          <div
            key={`${props.title}-${idx}`}
            style={{
              width: 9,
              height: `${Math.max(3, Math.round((v / max) * 38))}px`,
              borderRadius: 2,
              background: T.a,
              opacity: 0.8,
            }}
            title={String(v)}
          />
        ))}
        {!vals.length && <div style={{ fontSize: 11, color: T.d }}>No trend data</div>}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: T.m, fontFamily: T.mn }}>
        latest: {props.formatter ? props.formatter(latest) : String(latest)}
      </div>
    </div>
  );
}

export function TelemetryDashboardView({ mode = "overview" }: { mode?: Mode }) {
  const [data, setData] = useState<Overview | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fmt = (v: number | undefined, digits = 2) =>
    typeof v === "number" ? v.toFixed(digits) : "0";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { "x-tenant-id": tenantId };
      const [overviewRes, fleetRes] = await Promise.all([
        fetch("/api/telemetry/overview?limit=200", { headers }),
        fetch("/api/telemetry/fleet?limit=300", { headers }),
      ]);
      if (!overviewRes.ok || !fleetRes.ok) throw new Error("Failed to load telemetry");
      setData((await overviewRes.json()) as Overview);
      setFleet((await fleetRes.json()) as Fleet);
    } catch (e) {
      setData(null);
      setFleet(null);
      setError((e as Error).message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  const trends = useMemo(() => {
    const recent = data?.recent_runs || [];
    return {
      elapsedMs: recent.map((r) => r.elapsed_ms || 0),
      costUsd: recent.map((r) => r.cost_usd_estimate || 0),
      fallbackEvents: recent.map((r) => r.fallback_events || 0),
    };
  }, [data]);

  const queueDepth = fleet?.queue?.depth_total ?? 0;
  const stuckCount = fleet?.stuck_tasks?.count ?? 0;
  const retryNow = fleet?.retries?.retrying_now ?? 0;
  const failedRetries = fleet?.retries?.failed_after_retries ?? 0;
  const retryTotal = fleet?.retries?.tasks_with_retry ?? 0;
  const fallbackRate = fleet?.fallback_rate?.rate ?? 0;
  const approvalAvg = fleet?.approval_latency?.avg_seconds ?? 0;
  const approvalP95 = fleet?.approval_latency?.p95_seconds ?? 0;
  const costPerDecision = fleet?.cost_per_completed_decision?.value_usd ?? 0;

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: T.t }}>
          {mode === "fleet" ? "Fleet Ops Dashboard" : "Telemetry Dashboard"}
        </h3>
        <button onClick={load} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", background: T.bg, color: T.t }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {mode === "overview" && data && <div style={{ fontSize: 12, color: T.m, marginBottom: 8 }}>Total runs: {data.total_runs ?? 0}</div>}

      {mode === "overview" && !!data?.alerts?.length && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 4 }}>Alerts</div>
          {data.alerts.map((a, idx) => (
            <div key={idx} style={{ fontSize: 11, color: a.severity === "high" ? T.rd : T.y, fontFamily: T.mn }}>
              [{String(a.severity || "info").toUpperCase()}] {a.tier}: {a.code} ({String(a.value)})
            </div>
          ))}
        </div>
      )}

      {fleet && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 6 }}>Fleet Health</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
            <MetricCard
              title="Queue Depth"
              value={String(queueDepth)}
              sub={`urgent:${fleet.queue?.depth_by_priority?.urgent ?? 0} high:${fleet.queue?.depth_by_priority?.high ?? 0}`}
              severity={metricSeverity(queueDepth, 20, 50)}
            />
            <MetricCard
              title="Stuck Tasks"
              value={String(stuckCount)}
              sub={`threshold: ${fleet.stuck_tasks?.threshold_seconds ?? 0}s`}
              severity={metricSeverity(stuckCount, 1, 3)}
            />
            <MetricCard
              title="Retries"
              value={String(retryTotal)}
              sub={`now:${retryNow} failed:${failedRetries}`}
              severity={metricSeverity(failedRetries > 0 ? failedRetries : retryNow, 1, 3)}
            />
            <MetricCard
              title="Fallback Rate"
              value={`${fmt(fallbackRate * 100, 1)}%`}
              sub={`${fleet.fallback_rate?.fallback_runs ?? 0}/${fleet.fallback_rate?.completed_runs ?? 0} runs`}
              severity={metricSeverity(fallbackRate * 100, 10, 20)}
            />
            <MetricCard
              title="Approval Latency"
              value={`${fmt(approvalAvg, 1)}s`}
              sub={`p95:${fmt(approvalP95, 1)}s resolved:${fleet.approval_latency?.resolved_count ?? 0}`}
              severity={metricSeverity(approvalAvg, 900, 3600)}
            />
            <MetricCard
              title="Cost / Decision"
              value={`$${fmt(costPerDecision, 4)}`}
              sub={`runs:${fleet.cost_per_completed_decision?.completed_runs ?? 0}`}
              severity={metricSeverity(costPerDecision, 1, 3)}
            />
          </div>

          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            <MiniTrend
              title="Run Latency Trend"
              values={trends.elapsedMs}
              formatter={(v) => `${Math.round(v)}ms`}
            />
            <MiniTrend
              title="Decision Cost Trend"
              values={trends.costUsd}
              formatter={(v) => `$${v.toFixed(4)}`}
            />
            <MiniTrend
              title="Fallback Events Trend"
              values={trends.fallbackEvents}
              formatter={(v) => String(Math.round(v))}
            />
          </div>

          {!!fleet.stuck_tasks?.items?.length && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${T.b}`, paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: T.t, fontWeight: 700, marginBottom: 4 }}>Stuck Task Preview</div>
              {fleet.stuck_tasks.items.slice(0, 8).map((it, idx) => (
                <div key={`${it.task_id || "task"}-${idx}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>
                  {it.task_id} | {it.state} | prio={it.priority} owner={it.owner_agent} attempts={it.attempt_count} updated={it.updated_at || "n/a"}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "overview" && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, maxHeight: 380, overflow: "auto" }}>
          {!data?.tiers && <div style={{ color: T.d, fontSize: 12 }}>No data loaded.</div>}
          {data?.tiers && Object.entries(data.tiers).map(([tier, stats]) => (
            <div key={tier} style={{ marginBottom: 10, borderBottom: `1px solid ${T.b}`, paddingBottom: 8 }}>
              <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 4 }}>{tier}</div>
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>{k}: {String(v)}</div>
              ))}
            </div>
          ))}
          {!!data?.recent_runs?.length && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 4 }}>Recent Runs</div>
              {data.recent_runs.slice(0, 12).map((r, idx) => (
                <div key={`${r.run_id || "run"}-${idx}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>
                  {r.run_id} | tier={r.tier} status={r.status} cost=${r.cost_usd_estimate} elapsed={r.elapsed_ms}ms fallback={r.fallback_events}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "fleet" && !fleet && !loading && !error && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 12, background: T.bg, fontSize: 12, color: T.d }}>
          No fleet metrics loaded yet.
        </div>
      )}
    </div>
  );
}
