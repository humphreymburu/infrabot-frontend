import { T } from "../../lib/theme";

interface BadgeProps {
  color: string;
  bg?: string;
  children: React.ReactNode;
}

export const Badge = ({ color, bg, children }: BadgeProps) => (
  <span style={{ background: bg || "transparent", color, padding: "3px 10px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: T.mn, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

export const VBadge = ({ v }: { v?: string }) => {
  const m: Record<string, [string, string, string]> = {
    STRONGLY_RECOMMEND: [T.g, T.gD, "STRONGLY RECOMMEND"],
    RECOMMEND: [T.g, T.gD, "RECOMMEND"],
    RECOMMEND_WITH_CONDITIONS: [T.y, T.yD, "CONDITIONAL"],
    NEEDS_REVISION: [T.o, "rgba(251,146,60,0.08)", "NEEDS REVISION"],
    NOT_RECOMMENDED: [T.rd, T.rD, "NOT RECOMMENDED"],
  };
  const [c, b, l] = m[v ?? ""] || m.NEEDS_REVISION;
  return <Badge color={c} bg={b}>{l}</Badge>;
};

export const GBadge = ({ v }: { v?: string }) => {
  const m: Record<string, [string, string]> = {
    GO: [T.g, T.gD],
    CONDITIONAL_GO: [T.y, T.yD],
    DEFER: [T.o, "rgba(251,146,60,0.08)"],
    NO_GO: [T.rd, T.rD],
  };
  const [c, b] = m[v ?? ""] || [T.m, T.s];
  return <Badge color={c} bg={b}>{(v || "").replace(/_/g, " ")}</Badge>;
};

export const Dot = ({ l }: { l?: string }) => {
  const c: Record<string, string> = { CRITICAL: T.rd, HIGH: T.o, MEDIUM: T.y, LOW: T.g };
  return (
    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c[l ?? ""] || T.d, marginRight: 6, flexShrink: 0 }} />
  );
};

interface BarProps {
  score?: number;
  label: string;
  sub?: string;
}

export const Bar = ({ score, label, sub }: BarProps) => {
  const hasScore = typeof score === "number";
  const s = hasScore ? score : 0;
  const pct = (s / 10) * 100;
  const c = s >= 8 ? T.g : s >= 6 ? T.y : s >= 4 ? T.o : T.rd;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: T.m }}>{label}</span>
        <span style={{ fontSize: 11, color: hasScore ? c : T.d, fontWeight: 700, fontFamily: T.mn }}>{hasScore ? `${s}/10` : "—"}</span>
      </div>
      <div style={{ height: 5, background: T.b, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${hasScore ? pct : 0}%`, background: c, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
      {sub && <div style={{ fontSize: 10, color: T.d, marginTop: 2 }}>{sub}</div>}
    </div>
  );
};

interface KVProps {
  label: string;
  value?: string | number;
  mono?: boolean;
  color?: string;
}

export const KV = ({ label, value, mono, color }: KVProps) => (
  <div style={{ background: T.s, padding: "10px 14px", borderRadius: 7, border: `1px solid ${T.b}` }}>
    <div style={{ fontSize: 9, color: T.d, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3, fontFamily: T.mn }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: color || T.t, fontFamily: mono ? T.mn : T.sn, wordBreak: "break-word" }}>{value || "—"}</div>
  </div>
);

export const WTag = ({ w }: { w?: string }) => (
  <Badge color={({ PROPOSED: T.g, CURRENT: T.o, NEUTRAL: T.y } as Record<string, string>)[w ?? ""] || T.d}>{w}</Badge>
);

interface TabProps {
  active: boolean;
  label: string;
  onClick: () => void;
  count?: number;
}

export const Tab = ({ active, label, onClick, count }: TabProps) => (
  <button
    onClick={onClick}
    style={{ background: active ? T.aD : "transparent", border: `1px solid ${active ? T.aB : T.b}`, borderRadius: 6, padding: "6px 14px", fontSize: 10, fontFamily: T.mn, fontWeight: 700, color: active ? T.a : T.d, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}
  >
    {label}
    {count !== undefined && <span style={{ background: T.b, padding: "1px 5px", borderRadius: 3, fontSize: 9 }}>{count}</span>}
  </button>
);
