import { useState } from "react";
import { T, S } from "../../lib/theme";

interface SecProps {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Sec({ title, icon, defaultOpen = true, children }: SecProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.s, border: `1px solid ${T.b}`, borderRadius: 12, marginBottom: S.m, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${S.m}px ${S.l}px`, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: S.s }}>
          <span style={{ fontSize: 14, opacity: 0.7, color: T.a }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.t, fontFamily: T.sn }}>{title}</span>
        </div>
        <span style={{ color: T.m, fontSize: 14, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && <div style={{ padding: `0 ${S.l}px ${S.l}px` }}>{children}</div>}
    </div>
  );
}
