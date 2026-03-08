import { useState } from "react";
import { T, S } from "../lib/theme";

type LineageItem = Record<string, unknown>;

export function LineageExplorerView({ initialRunId }: { initialRunId?: string }) {
  const [runId, setRunId] = useState(initialRunId || "");
  const [lineage, setLineage] = useState<LineageItem | null>(null);
  const [ancestry, setAncestry] = useState<LineageItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!runId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/lineage/${encodeURIComponent(runId.trim())}`),
        fetch(`/api/lineage/${encodeURIComponent(runId.trim())}/ancestry?depth=20`),
      ]);
      if (!a.ok || !b.ok) throw new Error("Lineage not found");
      const d1 = (await a.json()) as LineageItem;
      const d2 = (await b.json()) as { ancestry?: LineageItem[] };
      setLineage(d1);
      setAncestry(d2.ancestry || []);
    } catch (e) {
      setLineage(null);
      setAncestry([]);
      setError((e as Error).message || "Failed to load lineage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Lineage Explorer</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="run_id" style={{ flex: 1, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }} />
        <button onClick={load} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: T.bg, color: T.t }}>{loading ? "Loading..." : "Load"}</button>
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {lineage && (
        <div style={{ marginBottom: 10, fontSize: 12, color: T.m }}>
          status={String(lineage.status || "")} parent={String(lineage.parent_run_id || "")} policy={String(lineage.policy_version || "")} schema={String(lineage.schema_version || "")}
        </div>
      )}
      <div style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg, maxHeight: 360, overflow: "auto" }}>
        {ancestry.length === 0 && <div style={{ color: T.d, fontSize: 12 }}>No ancestry loaded.</div>}
        {ancestry.map((node, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.b}`, fontSize: 11 }}>
            <div style={{ color: T.t, fontWeight: 700 }}>{String(node.run_id || "")}</div>
            <div style={{ color: T.m, fontFamily: T.mn }}>status={String(node.status || "")} parent={String(node.parent_run_id || "")}</div>
            <div style={{ color: T.d, fontFamily: T.mn }}>policy={String(node.policy_version || "")} prompt={String(node.prompt_bundle_version || "")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
