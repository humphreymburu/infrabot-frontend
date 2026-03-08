import { T } from "../lib/theme";
import { Sec } from "./ui/Sec";
import { Badge } from "./ui/Badge";
import type { Brief, SearchEntry } from "../types";

interface SourcesViewProps {
  d: Brief | null;
  searchLog: SearchEntry[];
}

export function SourcesView({ d, searchLog }: SourcesViewProps) {
  return (
    <div style={{ animation: "briefIn 0.5s ease" }}>
      {d?.research_sources && d.research_sources.length > 0 && (
        <Sec title={`Verified Sources (${d.research_sources.length})`} icon="🔍">
          {d.research_sources.map((src, i) => {
            const s = (src || {}) as Record<string, unknown>;
            const url = String(s.url || s.source_url || s.source || s.link || "").trim();
            const title = String(s.title || s.name || s.source_name || url || "Untitled source").trim();
            const keyData = String(
              s.key_data || s.content || s.excerpt || s.summary || s.snippet || s.source_span || "",
            ).trim();
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${T.b}`, fontSize: 12 }}>
                <div style={{ color: T.t, fontWeight: 600 }}>{title}</div>
                {keyData && <div style={{ color: T.d, fontSize: 11, marginTop: 2 }}>{keyData}</div>}
                {url && <a href={url} target="_blank" rel="noreferrer" style={{ color: T.a, fontSize: 10, fontFamily: T.mn, textDecoration: "none" }}>↗ {url}</a>}
              </div>
            );
          })}
        </Sec>
      )}
      <Sec title={`Search Log (${searchLog.length} queries)`} icon="→">
        {searchLog.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 10, fontFamily: T.mn, borderBottom: `1px solid ${T.b}` }}>
            <Badge color={T.a} bg={T.aD}>{s.agent}</Badge>
            <span style={{ color: T.m }}>{s.query}</span>
          </div>
        ))}
      </Sec>
    </div>
  );
}
