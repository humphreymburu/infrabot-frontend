import { useState } from "react";
import { T, S } from "../lib/theme";

type DiffMap = Record<string, { run_a: unknown; run_b: unknown }>;
type FocusDeltas = Record<string, unknown>;
type Comparability = {
  comparable?: boolean;
  reasons?: string[];
  migration_notes?: string[];
  variance_tolerance?: Record<string, unknown>;
};
const tenantId = import.meta.env.VITE_TENANT_ID || "local-dev";

export function TraceDiffView({ defaultA }: { defaultA?: string }) {
  const [runA, setRunA] = useState(defaultA || "");
  const [runB, setRunB] = useState("");
  const [loading, setLoading] = useState(false);
  const [diffs, setDiffs] = useState<DiffMap>({});
  const [focus, setFocus] = useState<FocusDeltas>({});
  const [comparability, setComparability] = useState<Comparability | null>(null);
  const [error, setError] = useState("");

  const compare = async () => {
    if (!runA.trim() || !runB.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/traces/compare?run_a=${encodeURIComponent(runA.trim())}&run_b=${encodeURIComponent(runB.trim())}`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (!res.ok) throw new Error("Trace compare failed");
      const data = (await res.json()) as { diffs?: DiffMap; focus_deltas?: FocusDeltas; comparability?: Comparability };
      setDiffs(data.diffs || {});
      setFocus(data.focus_deltas || {});
      setComparability(data.comparability || null);
    } catch (e) {
      setDiffs({});
      setFocus({});
      setComparability(null);
      setError((e as Error).message || "Failed to compare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Run Diff</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 10 }}>
        <input value={runA} onChange={(e) => setRunA(e.target.value)} placeholder="run_a" style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }} />
        <input value={runB} onChange={(e) => setRunB(e.target.value)} placeholder="run_b" style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }} />
        <button onClick={compare} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: T.bg, color: T.t }}>
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {comparability && (
        <div
          style={{
            marginBottom: 10,
            border: `1px solid ${comparability.comparable ? T.g : T.y}`,
            borderRadius: 8,
            padding: 8,
            background: T.bg,
          }}
        >
          <div style={{ fontSize: 11, color: T.t, fontWeight: 700, marginBottom: 4 }}>
            Comparability: {comparability.comparable ? "Comparable" : "Not directly comparable"}
          </div>
          {!comparability.comparable && (comparability.reasons || []).length > 0 && (
            <div style={{ fontSize: 11, color: T.m }}>
              Reasons: {(comparability.reasons || []).join(", ")}
            </div>
          )}
          {(comparability.migration_notes || []).length > 0 && (
            <div style={{ fontSize: 11, color: T.m, marginTop: 4 }}>
              Notes: {(comparability.migration_notes || []).join(" | ")}
            </div>
          )}
        </div>
      )}
      {Object.keys(focus).length > 0 && (
        <div style={{ marginBottom: 10, border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg }}>
          <div style={{ fontSize: 11, color: T.t, fontWeight: 700, marginBottom: 6 }}>Focus Deltas</div>
          {Object.entries(focus).map(([k, v]) => (
            <div key={k} style={{ padding: "6px 0", borderBottom: `1px solid ${T.b}` }}>
              <div style={{ fontSize: 11, color: T.t }}>{k}</div>
              <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn, whiteSpace: "pre-wrap" }}>{JSON.stringify(v, null, 2)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ maxHeight: 380, overflow: "auto", border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg }}>
        {Object.keys(diffs).length === 0 && <div style={{ color: T.d, fontSize: 12 }}>No differences loaded.</div>}
        {Object.entries(diffs).map(([k, v]) => (
          <div key={k} style={{ padding: "8px 0", borderBottom: `1px solid ${T.b}` }}>
            <div style={{ fontSize: 11, color: T.t, fontWeight: 700 }}>{k}</div>
            <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>A: {String(v.run_a)}</div>
            <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>B: {String(v.run_b)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
