import { useState } from "react";
import { T, S } from "../lib/theme";

type SimResult = Record<string, unknown>;
type ReplayResult = {
  candidate_policy?: { mode?: string; tier?: string | null };
  window?: { sample_limit?: number; requested_runs?: number; evaluated_runs?: number; replayed_runs?: number; skipped_runs?: number };
  scorecard?: {
    avg_diff_risk_score?: number;
    p95_diff_risk_score?: number;
    high_risk_runs?: number;
    review_risk_runs?: number;
    safe_runs?: number;
    rollout_decision?: string;
  };
  replay?: { mode?: string; note?: string };
  items?: Array<{
    run_id?: string;
    status?: string;
    reason?: string;
    diff_risk?: { score?: number; verdict?: string; drivers?: string[]; cost_delta_pct?: number | null; elapsed_delta_pct?: number | null };
    baseline_policy?: { mode?: string; tier?: string; path?: string };
    projected_policy?: { mode?: string; tier?: string; path?: string };
    candidate_replay_run_id?: string | null;
  }>;
};

const tenantId = import.meta.env.VITE_TENANT_ID || "local-dev";

function riskColor(score: number | undefined) {
  const v = Number(score || 0);
  if (v >= 50) return T.rd;
  if (v >= 20) return T.y;
  return T.g;
}

export function PolicySimulatorView() {
  const [msg, setMsg] = useState("");
  const [tier, setTier] = useState("");
  const [mode, setMode] = useState("");
  const [result, setResult] = useState<SimResult | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [sampleLimit, setSampleLimit] = useState(20);
  const [executeReplay, setExecuteReplay] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    if (!msg.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/policy/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          user_message: msg,
          force_tier: tier || undefined,
          mode_override: mode || undefined,
        }),
      });
      if (!res.ok) throw new Error("Policy simulation failed");
      setResult((await res.json()) as SimResult);
    } catch (e) {
      setResult(null);
      setError((e as Error).message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const simulateReplay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/policy/simulate/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({
          candidate_mode: mode || "enforced_partial",
          candidate_tier: tier || undefined,
          sample_limit: sampleLimit,
          execute_replay: executeReplay,
        }),
      });
      if (!res.ok) throw new Error("Replay simulation failed");
      setReplayResult((await res.json()) as ReplayResult);
    } catch (e) {
      setReplayResult(null);
      setError((e as Error).message || "Replay simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Policy Simulator</h3>

      <div style={{ border: `1px solid ${T.b}`, borderRadius: 10, background: T.bg, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 8 }}>Single Prompt Preview</div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Paste decision prompt..."
          style={{ width: "100%", minHeight: 90, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: "#FFFFFF", color: T.t, marginBottom: 8 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: "#FFFFFF", color: T.t }}>
            <option value="">force_tier (none)</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: "#FFFFFF", color: T.t }}>
            <option value="">mode_override (none)</option>
            <option value="shadow">shadow</option>
            <option value="enforced_partial">enforced_partial</option>
            <option value="enforced_full">enforced_full</option>
          </select>
          <button onClick={simulate} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: "#FFFFFF", color: T.t }}>
            {loading ? "Running..." : "Simulate"}
          </button>
        </div>
      </div>

      <div style={{ border: `1px solid ${T.b}`, borderRadius: 10, background: T.bg, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 8 }}>Replay Shadow Simulation</div>
        <div style={{ display: "grid", gridTemplateColumns: "220px 220px auto", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            max={100}
            value={sampleLimit}
            onChange={(e) => setSampleLimit(Math.max(1, Math.min(100, Number(e.target.value) || 20)))}
            style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: "#FFFFFF", color: T.t }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.m }}>
            <input type="checkbox" checked={executeReplay} onChange={(e) => setExecuteReplay(e.target.checked)} />
            Execute full replay
          </label>
          <button onClick={simulateReplay} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: "#FFFFFF", color: T.t }}>
            {loading ? "Running..." : "Run Replay Simulation"}
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: T.d }}>
          Full replay uses cached replay artifacts; projected-only mode still computes policy drift and rollout scorecard.
        </div>
      </div>

      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {replayResult && (
        <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: T.t, fontWeight: 700, marginBottom: 6 }}>Replay Scorecard</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: T.d }}>Avg Diff Risk</div>
              <div style={{ fontSize: 16, color: riskColor(replayResult.scorecard?.avg_diff_risk_score), fontWeight: 700 }}>{replayResult.scorecard?.avg_diff_risk_score ?? 0}</div>
            </div>
            <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: T.d }}>P95 Diff Risk</div>
              <div style={{ fontSize: 16, color: riskColor(replayResult.scorecard?.p95_diff_risk_score), fontWeight: 700 }}>{replayResult.scorecard?.p95_diff_risk_score ?? 0}</div>
            </div>
            <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: T.d }}>Rollout Decision</div>
              <div style={{ fontSize: 16, color: T.t, fontWeight: 700 }}>{replayResult.scorecard?.rollout_decision || "n/a"}</div>
            </div>
            <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: T.d }}>Replayed Runs</div>
              <div style={{ fontSize: 16, color: T.t, fontWeight: 700 }}>{replayResult.window?.replayed_runs ?? 0}</div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.m }}>{replayResult.replay?.note}</div>

          {!!replayResult.items?.length && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${T.b}`, paddingTop: 8, maxHeight: 260, overflow: "auto" }}>
              {replayResult.items.slice(0, 20).map((it, idx) => (
                <div key={`${it.run_id || "run"}-${idx}`} style={{ fontSize: 11, color: T.m, fontFamily: T.mn, marginBottom: 4 }}>
                  {it.run_id} | status={it.status} | risk={it.diff_risk?.score ?? 0} ({it.diff_risk?.verdict || "n/a"}) | baseline={it.baseline_policy?.mode}/{it.baseline_policy?.tier} | candidate={it.projected_policy?.mode}/{it.projected_policy?.tier}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, maxHeight: 280, overflow: "auto" }}>
        {!result && <div style={{ color: T.d, fontSize: 12 }}>No single-prompt result yet.</div>}
        {result && <pre style={{ margin: 0, fontSize: 11, color: T.m, fontFamily: T.mn, whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
}
