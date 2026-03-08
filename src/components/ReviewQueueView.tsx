import { useState } from "react";
import { T, S } from "../lib/theme";

type ReviewItem = {
  review_id: string;
  run_id: string;
  stage: string;
  reason: string;
  status: string;
  payload?: Record<string, unknown>;
};

export function ReviewQueueView() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewer, setReviewer] = useState("ops-reviewer");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews/pending?limit=100");
      if (!res.ok) throw new Error("Failed to load review queue");
      const data = (await res.json()) as { items?: ReviewItem[] };
      setItems(data.items || []);
    } catch (e) {
      setError((e as Error).message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (reviewId: string, action: string) => {
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewer }),
      });
      if (!res.ok) throw new Error("Decision submit failed");
      await load();
    } catch (e) {
      setError((e as Error).message || "Decision failed");
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: T.t }}>Review Queue</h3>
        <button onClick={load} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "6px 10px", background: T.bg, color: T.t }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="reviewer"
          style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t, width: "100%" }}
        />
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ maxHeight: 420, overflow: "auto", border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg }}>
        {items.length === 0 && <div style={{ color: T.d, fontSize: 12 }}>No pending reviews.</div>}
        {items.map((it) => (
          <div key={it.review_id} style={{ borderBottom: `1px solid ${T.b}`, padding: "8px 0" }}>
            <div style={{ fontSize: 11, color: T.t, fontWeight: 700 }}>{it.stage} • {it.reason}</div>
            <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>run_id={it.run_id}</div>
            <div style={{ fontSize: 11, color: T.m, fontFamily: T.mn }}>review_id={it.review_id}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => decide(it.review_id, "approve")} style={{ border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", background: T.gD, color: T.g }}>Approve</button>
              <button onClick={() => decide(it.review_id, "reject")} style={{ border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", background: T.rD, color: T.rd }}>Reject</button>
              <button onClick={() => decide(it.review_id, "request_rerun")} style={{ border: `1px solid ${T.b}`, borderRadius: 6, padding: "4px 8px", background: T.yD, color: T.y }}>Request rerun</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
