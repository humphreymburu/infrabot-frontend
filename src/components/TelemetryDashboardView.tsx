import { useState } from "react";
import { T, S } from "../lib/theme";

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

export function TelemetryDashboardView() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/telemetry/overview?limit=200");
      if (!res.ok) throw new Error("Failed to load telemetry");
      setData((await res.json()) as Overview);
    } catch (e) {
      setData(null);
      setError((e as Error).message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: T.t }}>Telemetry Dashboard</h3>
        <button onClick={load} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", background: T.bg, color: T.t }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {data && <div style={{ fontSize: 12, color: T.m, marginBottom: 8 }}>Total runs: {data.total_runs ?? 0}</div>}
      {!!data?.alerts?.length && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 4 }}>Alerts</div>
          {data.alerts.map((a, idx) => (
            <div key={idx} style={{ fontSize: 11, color: a.severity === "high" ? T.rd : T.yw, fontFamily: T.mn }}>
              [{String(a.severity || "info").toUpperCase()}] {a.tier}: {a.code} ({String(a.value)})
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}
