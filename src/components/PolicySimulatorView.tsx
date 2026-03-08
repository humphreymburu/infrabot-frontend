import { useState } from "react";
import { T, S } from "../lib/theme";

type SimResult = Record<string, unknown>;

export function PolicySimulatorView() {
  const [msg, setMsg] = useState("");
  const [tier, setTier] = useState("");
  const [mode, setMode] = useState("");
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    if (!msg.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/policy/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Policy Simulator</h3>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Paste decision prompt..."
        style={{ width: "100%", minHeight: 110, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t, marginBottom: 8 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }}>
          <option value="">force_tier (none)</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }}>
          <option value="">mode_override (none)</option>
          <option value="shadow">shadow</option>
          <option value="enforced_partial">enforced_partial</option>
          <option value="enforced_full">enforced_full</option>
        </select>
        <button onClick={simulate} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: T.bg, color: T.t }}>
          {loading ? "Running..." : "Simulate"}
        </button>
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, maxHeight: 360, overflow: "auto" }}>
        {!result && <div style={{ color: T.d, fontSize: 12 }}>No result yet.</div>}
        {result && <pre style={{ margin: 0, fontSize: 11, color: T.m, fontFamily: T.mn, whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
}
