import { useState } from "react";
import { T, S } from "../lib/theme";

type TraceEvent = Record<string, unknown>;

export function TraceReplayView({ initialRunId }: { initialRunId?: string }) {
  const [runId, setRunId] = useState(initialRunId || "");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!runId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [sRes, eRes] = await Promise.all([
        fetch(`/api/traces/${encodeURIComponent(runId.trim())}/summary`),
        fetch(`/api/traces/${encodeURIComponent(runId.trim())}/events?limit=500`),
      ]);
      if (!sRes.ok || !eRes.ok) throw new Error("Trace not found");
      const s = (await sRes.json()) as Record<string, unknown>;
      const e = (await eRes.json()) as { events?: TraceEvent[] };
      setSummary(s);
      setEvents(e.events || []);
    } catch (e) {
      setSummary(null);
      setEvents([]);
      setError((e as Error).message || "Failed to load trace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: S.l }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, color: T.t }}>Trace Replay</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
          placeholder="Enter run_id"
          style={{ flex: 1, border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 10px", background: T.bg, color: T.t }}
        />
        <button onClick={load} disabled={loading} style={{ border: `1px solid ${T.b}`, borderRadius: 8, padding: "8px 12px", background: T.bg, color: T.t }}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
      {error && <div style={{ color: T.rd, fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {summary && (
        <div style={{ fontSize: 12, color: T.m, marginBottom: 10 }}>
          status={String(summary.status || "")} llm_calls={String((summary.metrics as Record<string, unknown> | undefined)?.llm_calls || 0)} search_calls={String((summary.metrics as Record<string, unknown> | undefined)?.search_calls || 0)}
        </div>
      )}
      <div style={{ maxHeight: 380, overflow: "auto", border: `1px solid ${T.b}`, borderRadius: 8, padding: 8, background: T.bg }}>
        {events.length === 0 && <div style={{ color: T.d, fontSize: 12 }}>No events loaded.</div>}
        {events.map((ev, i) => (
          <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.b}`, fontSize: 11, color: T.m, fontFamily: T.mn }}>
            [{String(ev.ts || "")}] {String(ev.type || "")} stage={String(ev.stage || "")} agent={String(ev.agent || "")} status={String(ev.status || "")}
          </div>
        ))}
      </div>
    </div>
  );
}
