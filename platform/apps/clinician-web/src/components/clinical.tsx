/**
 * clinical.tsx — presentational components for clinical data (Vol 3, Vol 7).
 * All clinical signal is derived from @diabetes-quest/clinical; colour is never the only
 * cue (each carries a label), per the design-system accessibility rule.
 */
import React from "react";
import type { TimeInRanges, HourBand, Flag, Severity } from "@diabetes-quest/clinical";

const SEVERITY_COLOR: Record<Severity | "none", string> = {
  urgent: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
  none: "#16a34a",
};

export function RiskBadge({ tier }: { tier: "high" | "medium" | "low" }): React.JSX.Element {
  const color = tier === "high" ? "#dc2626" : tier === "medium" ? "#d97706" : "#16a34a";
  return (
    <span style={{ background: color, color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>
      {tier.toUpperCase()} RISK
    </span>
  );
}

/** Stacked horizontal time-in-range bar (very low → very high). */
export function TimeInRangeBar({ tir }: { tir: TimeInRanges }): React.JSX.Element {
  const segments: { key: keyof TimeInRanges; color: string; label: string }[] = [
    { key: "veryLow", color: "#b91c1c", label: "<54" },
    { key: "low", color: "#dc2626", label: "54–69" },
    { key: "target", color: "#16a34a", label: "70–180" },
    { key: "high", color: "#d97706", label: "181–250" },
    { key: "veryHigh", color: "#b45309", label: ">250" },
  ];
  return (
    <div>
      <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden" }}>
        {segments.map((s) => (
          <div key={s.key} title={`${s.label}: ${tir[s.key]}%`} style={{ width: `${tir[s.key]}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ fontSize: 13, marginTop: 4 }}>
        Time-in-range (70–180): <strong>{tir.target}%</strong> · below 70: {Math.round((tir.veryLow + tir.low) * 10) / 10}%
      </div>
    </div>
  );
}

/** Minimal AGP: median line with the 25–75 percentile band across the day. */
export function AgpChart({ bands }: { bands: HourBand[] }): React.JSX.Element {
  const W = 640, H = 180, padL = 32, padB = 18;
  const x = (h: number) => padL + (h / 23) * (W - padL - 8);
  const y = (g: number) => H - padB - ((Math.max(40, Math.min(300, g)) - 40) / (300 - 40)) * (H - padB - 8);
  const band =
    bands.map((b) => `${x(b.hour)},${y(b.p75)}`).join(" ") +
    " " +
    [...bands].reverse().map((b) => `${x(b.hour)},${y(b.p25)}`).join(" ");
  const median = bands.map((b) => `${x(b.hour)},${y(b.p50)}`).join(" ");
  return (
    <svg width={W} height={H} role="img" aria-label="Ambulatory glucose profile">
      {[70, 180].map((g) => (
        <line key={g} x1={padL} x2={W - 8} y1={y(g)} y2={y(g)} stroke="#16a34a" strokeDasharray="4 4" opacity={0.5} />
      ))}
      {bands.length > 1 && <polygon points={band} fill="#2563eb" opacity={0.15} />}
      {bands.length > 1 && <polyline points={median} fill="none" stroke="#2563eb" strokeWidth={2} />}
      <text x={4} y={y(180)} fontSize={10} fill="#64748b">180</text>
      <text x={4} y={y(70)} fontSize={10} fill="#64748b">70</text>
    </svg>
  );
}

export function FlagList({ flags }: { flags: Flag[] }): React.JSX.Element {
  if (flags.length === 0) return <p style={{ color: "#16a34a" }}>No decision-support flags.</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {flags.map((f) => (
        <li key={f.code} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: SEVERITY_COLOR[f.severity] }} />
          <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 11, color: SEVERITY_COLOR[f.severity] }}>
            {f.severity}
          </span>
          <span>{f.message}</span>
        </li>
      ))}
    </ul>
  );
}
