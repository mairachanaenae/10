"use client";

import { useState } from "react";
import type { AssetClass, Holding } from "@/lib/types";
import { money } from "@/lib/utils";

const PALETTE: Record<string, string> = {
  ETF: "#6ea8fe",
  Stock: "#9d8bf6",
  Cash: "#22d3ee",
  Crypto: "#22d3ee",
  RealEstate: "#e9c46a",
  Business: "#fb7185",
};

const ALL: { cls: AssetClass; label: string; note: string }[] = [
  { cls: "ETF", label: "ETFs", note: "Broad index core" },
  { cls: "Stock", label: "Stocks", note: "Single-company picks" },
  { cls: "Cash", label: "Cash", note: "Dry powder" },
  { cls: "Crypto", label: "Crypto", note: "Not held yet" },
  { cls: "RealEstate", label: "Real Estate", note: "A future goal" },
  { cls: "Business", label: "Business", note: "Future income" },
];

export function WealthMap({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((a, h) => a + h.value, 0) || 1;
  const byClass = (c: AssetClass) =>
    holdings.filter((h) => h.assetClass === c).reduce((a, h) => a + h.value, 0);

  const nodes = ALL.map((a) => ({ ...a, value: byClass(a.cls) }));
  const [active, setActive] = useState<(typeof nodes)[number] | null>(null);

  const cx = 230;
  const cy = 140;
  const R = 100;

  return (
    <div>
      <svg viewBox="0 0 460 280" className="h-[260px] w-full" role="img" aria-label="Wealth ecosystem">
        <circle cx={cx} cy={cy} r={32} fill="rgba(110,168,254,.12)" stroke="var(--line2)" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-ink" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12 }}>
          You
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" style={{ fill: "#9aa7c2", fontSize: 10 }}>
          {money(total, "NOK", 0).replace("NOK ", "")}
        </text>
        {nodes.map((n, i) => {
          const a = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + R * Math.cos(a);
          const y = cy + R * Math.sin(a);
          const r = n.value > 0 ? 13 + Math.min(15, (n.value / total) * 40) : 10;
          const col = PALETTE[n.cls];
          return (
            <g key={n.cls} onMouseEnter={() => setActive(n)} onClick={() => setActive(n)} style={{ cursor: "pointer" }}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.1)" />
              <circle cx={x} cy={y} r={r} fill={`${col}22`} stroke={col} />
              <text x={x} y={y + r + 13} textAnchor="middle" style={{ fill: "var(--ink)", fontSize: 10 }}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="min-h-[40px] text-[13px]">
        {active ? (
          <>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted">
              {active.label} · {((active.value / total) * 100).toFixed(1)}% of net worth
            </div>
            <div className="text-muted">
              {money(active.value)} — {active.note}
            </div>
          </>
        ) : (
          <span className="text-faint">Hover a node to inspect an asset class.</span>
        )}
      </div>
    </div>
  );
}
