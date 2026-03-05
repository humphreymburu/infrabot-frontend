import { T } from "../lib/theme";
import type { Brief } from "../types";

interface DiffViewProps {
  current: Brief | null | undefined;
  previous: Brief | null | undefined;
}

const summarize = (b: Brief | null | undefined): string => {
  if (!b) return "";
  const parts: string[] = [];
  parts.push(`verdict:${b.meta?.verdict ?? ""}`);
  parts.push(`confidence:${String(b.meta?.confidence_score ?? "")}`);
  parts.push(`summary:${b.meta?.executive_summary ?? b.meta?.proposal_summary ?? ""}`);
  parts.push(`recommendation:${b.recommendation?.decision ?? ""}`);
  parts.push(`rationale:${b.recommendation?.rationale ?? ""}`);
  return parts.join(" | ");
};

export function DiffView({ current, previous }: DiffViewProps) {
  if (!current || !previous) {
    return (
      <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.m }}>
          Need two analyses to compare. Open a brief from History and choose Compare.
        </p>
      </div>
    );
  }

  const sections = [
    {
      label: "Verdict",
      before: previous.meta?.verdict ?? "n/a",
      after: current.meta?.verdict ?? "n/a",
    },
    {
      label: "Confidence",
      before: String(previous.meta?.confidence_score ?? "n/a"),
      after: String(current.meta?.confidence_score ?? "n/a"),
    },
    {
      label: "Executive Summary",
      before: previous.meta?.executive_summary ?? previous.meta?.proposal_summary ?? "n/a",
      after: current.meta?.executive_summary ?? current.meta?.proposal_summary ?? "n/a",
    },
    {
      label: "Decision",
      before: previous.recommendation?.decision ?? "n/a",
      after: current.recommendation?.decision ?? "n/a",
    },
  ];

  const fingerprintChanged = summarize(current) !== summarize(previous);

  return (
    <div style={{ display: "grid", gap: 10, animation: "briefIn 0.5s ease" }}>
      <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12, color: T.d, marginBottom: 6 }}>Comparison status</div>
        <div style={{ fontSize: 13, color: fingerprintChanged ? T.o : T.g, fontWeight: 600 }}>
          {fingerprintChanged ? "Detected meaningful changes between the two briefs." : "No major changes detected."}
        </div>
      </div>
      {sections.map((s) => {
        const changed = s.before !== s.after;
        return (
          <div key={s.label} style={{ background: T.s, border: `1px solid ${changed ? T.aB : T.b}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: T.d, marginBottom: 8 }}>{s.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Previous</div>
                <div style={{ fontSize: 12, color: T.m, whiteSpace: "pre-wrap" }}>{s.before}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.d, marginBottom: 4 }}>Current</div>
                <div style={{ fontSize: 12, color: T.t, whiteSpace: "pre-wrap" }}>{s.after}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
