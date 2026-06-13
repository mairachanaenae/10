"use client";

import { useMemo, useState } from "react";

type Cat = "Growth" | "Value" | "Dividend";
interface Opp {
  t: string;
  name: string;
  cat: Cat;
  r: number; // signal strength 0..1
  note: string;
}

const OPPS: Opp[] = [
  { t: "MSFT", name: "Microsoft", cat: "Growth", r: 0.4, note: "AI + cloud momentum" },
  { t: "ASML", name: "ASML", cat: "Growth", r: 0.5, note: "Chip-equipment moat" },
  { t: "NVO", name: "Novo Nordisk", cat: "Growth", r: 0.45, note: "Healthcare innovation" },
  { t: "BRK.B", name: "Berkshire", cat: "Value", r: 0.55, note: "Diversified, defensive" },
  { t: "PYPL", name: "PayPal", cat: "Value", r: 0.8, note: "Cheap vs history" },
  { t: "KO", name: "Coca-Cola", cat: "Dividend", r: 0.7, note: "Dividend King" },
  { t: "O", name: "Realty Income", cat: "Dividend", r: 0.6, note: "Monthly REIT income" },
  { t: "VICI", name: "VICI Properties", cat: "Dividend", r: 0.65, note: "Gaming REIT yield" },
];

const CATS: Cat[] = ["Growth", "Value", "Dividend"];
const COLOR: Record<Cat, string> = { Growth: "#6ea8fe", Value: "#9d8bf6", Dividend: "#34d399" };

export function Radar() {
  const [on, setOn] = useState<Set<Cat>>(new Set(CATS));
  const [active, setActive] = useState<Opp | null>(null);

  const visible = useMemo(() => OPPS.filter((o) => on.has(o.cat)), [on]);
  const cx = 230;
  const cy = 160;
  const R = 130;

  function toggle(c: Cat) {
    setOn((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={
              "rounded-full border px-3 py-1.5 text-[12px] transition " +
              (on.has(c)
                ? "border-blue bg-blue/[0.14] text-blue"
                : "border-line text-muted hover:text-ink")
            }
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: COLOR[c] }} />
            {c}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 460 340" className="h-[330px] w-full" role="img" aria-label="Opportunity radar">
        {[1, 2, 3].map((i) => (
          <circle key={i} cx={cx} cy={cy} r={(R * i) / 3} fill="none" stroke="rgba(255,255,255,.07)" />
        ))}
        {visible.map((o, i) => {
          const a = (OPPS.indexOf(o) / OPPS.length) * 2 * Math.PI;
          const rr = R * (1 - o.r * 0.7);
          const x = cx + rr * Math.cos(a);
          const y = cy + rr * Math.sin(a);
          const col = COLOR[o.cat];
          return (
            <g key={o.t} style={{ cursor: "pointer" }} onMouseEnter={() => setActive(o)} onClick={() => setActive(o)}>
              <circle cx={x} cy={y} r={9} fill={`${col}33`} stroke={col} />
              <text x={x} y={y - 12} textAnchor="middle" style={{ fill: "var(--ink)", fontSize: 10 }}>
                {o.t}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="min-h-[36px] text-[13px]">
        {active ? (
          <>
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted">
              {active.t} · {active.name} · {active.cat}
            </div>
            <div className="text-muted">
              {active.note} · signal strength {(active.r * 100).toFixed(0)}%
            </div>
          </>
        ) : (
          <span className="text-faint">Hover a signal. Toggle categories above. Illustrative, not advice.</span>
        )}
      </div>
    </div>
  );
}
