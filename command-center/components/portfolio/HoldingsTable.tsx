"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { breakdown, rank, RANK_MAX, score, type ScoreBreakdown } from "@/lib/scoring";
import { councilReactions } from "@/lib/mentors";
import type { Holding } from "@/lib/types";
import { money, pct } from "@/lib/utils";

type Key = "symbol" | "shares" | "value" | "weight" | "dayPct";

const rankColor: Record<string, string> = {
  S: "text-gold border-gold",
  A: "text-emerald border-emerald",
  B: "text-blue border-blue",
  C: "text-violet border-violet",
  D: "text-muted border-line",
  E: "text-muted border-line",
};

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((a, h) => a + h.value, 0) || 1;
  const [sortKey, setSortKey] = useState<Key>("value");
  const [dir, setDir] = useState(-1);
  const [open, setOpen] = useState<Holding | null>(null);

  const rows = useMemo(() => {
    const withW = holdings.map((h) => ({ ...h, weight: (h.value / total) * 100 }));
    return withW.sort((a, b) => {
      const av = a[sortKey as keyof typeof a] as number | string;
      const bv = b[sortKey as keyof typeof b] as number | string;
      return (av > bv ? 1 : -1) * dir;
    });
  }, [holdings, sortKey, dir, total]);

  function sort(k: Key) {
    if (k === sortKey) setDir((d) => -d);
    else {
      setSortKey(k);
      setDir(-1);
    }
  }

  const th = (k: Key, label: string, right = false) => (
    <th
      onClick={() => sort(k)}
      className={
        "cursor-pointer select-none px-2 py-3 text-[11px] uppercase tracking-[0.1em] text-muted " +
        (right ? "text-right" : "text-left")
      }
    >
      {label}
      {sortKey === k ? (dir < 0 ? " ↓" : " ↑") : ""}
    </th>
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {th("symbol", "Asset")}
              {th("shares", "Shares", true)}
              {th("value", "Value", true)}
              {th("weight", "Weight", true)}
              {th("dayPct", "Today", true)}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr
                key={h.symbol}
                tabIndex={0}
                role="button"
                onClick={() => h.stats && setOpen(h)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && h.stats && setOpen(h)}
                className={
                  "border-b border-line transition hover:bg-blue/[0.05] " +
                  (h.stats ? "cursor-pointer" : "")
                }
              >
                <td className="px-2 py-3">
                  <span className="font-semibold">{h.symbol}</span>{" "}
                  <span className="text-[12px] text-faint">{h.name}</span>
                </td>
                <td className="px-2 py-3 text-right tnum">{h.shares}</td>
                <td className="px-2 py-3 text-right tnum">{money(h.value)}</td>
                <td className="px-2 py-3 text-right tnum">{h.weight.toFixed(1)}%</td>
                <td className={"px-2 py-3 text-right tnum " + (h.dayPct >= 0 ? "text-emerald" : "text-danger")}>
                  {pct(h.dayPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-faint">Click a stock row for the mentor council&apos;s take.</p>

      {open && open.stats && <StatSheet holding={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function StatSheet({ holding, onClose }: { holding: Holding; onClose: () => void }) {
  const stats = holding.stats!;
  const s = score(stats);
  const r = rank(s);
  const b = breakdown(stats);
  const council = councilReactions(stats, s);

  const bar = (label: string, key: keyof ScoreBreakdown) => (
    <div className="my-2.5">
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-[0.08em] text-muted">
        <span>{label}</span>
        <span>
          {b[key]}/{RANK_MAX[key]}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue to-emerald"
          style={{ width: `${(b[key] / RANK_MAX[key]) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass max-h-[88vh] w-[min(560px,96vw)] overflow-auto p-6">
        <div className="flex items-start gap-3">
          <span className={"grid h-11 w-11 place-items-center rounded-xl border font-display text-lg font-bold " + rankColor[r]}>
            {r}
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold">{holding.symbol}</h3>
            <div className="text-[12px] text-faint">{holding.name}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-muted hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 text-[13px] text-muted">
          Dividend-safety score <span className="font-display text-ink">{s}/100</span>
        </div>

        <h4 className="mb-1 font-display text-[12px] uppercase tracking-[0.18em] text-blue">Score breakdown</h4>
        {bar("Payout coverage", "cover")}
        {bar("Debt safety", "debt")}
        {bar("Dividend record", "record")}
        {bar("Yield (trap?) safety", "yieldSafety")}

        <h4 className="mb-2 mt-5 font-display text-[12px] uppercase tracking-[0.18em] text-blue">🤖 Mentor council</h4>
        <div className="space-y-2.5">
          {council.map((c) => (
            <div key={c.name} className="flex items-start gap-3 text-[13px]">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line2 bg-surface2">
                {c.emoji}
              </span>
              <div>
                <div className="font-semibold text-blue">{c.name}-bot</div>
                <div className="text-muted">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-faint">Rule-based for now. Live Claude council comes with an API key.</p>
      </div>
    </div>
  );
}
