"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const FRAMES = ["1W", "1M", "1Y", "All"] as const;
type Frame = (typeof FRAMES)[number];

const POINTS: Record<Frame, number> = { "1W": 14, "1M": 30, "1Y": 52, All: 60 };
const TREND: Record<Frame, number> = { "1W": 0.4, "1M": 0.5, "1Y": 0.7, All: 0.9 };

// Deterministic pseudo-random so the static export is stable.
function series(n: number, trend: number, seed: number) {
  let v = 100;
  let s = seed;
  const out: { i: number; v: number }[] = [{ i: 0, v }];
  for (let i = 1; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = (s / 0x7fffffff - 0.5) * 6;
    v = Math.max(40, v + r + trend);
    out.push({ i, v: Math.round(v * 100) / 100 });
  }
  return out;
}

export function PerformanceChart() {
  const [frame, setFrame] = useState<Frame>("1M");
  const data = useMemo(() => series(POINTS[frame], TREND[frame], 7), [frame]);

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {FRAMES.map((f) => (
          <button
            key={f}
            onClick={() => setFrame(f)}
            className={
              "rounded-lg border px-3 py-1 text-[12px] transition " +
              (f === frame
                ? "border-line2 bg-white/[0.06] text-ink"
                : "border-line text-muted hover:text-ink")
            }
          >
            {f}
          </button>
        ))}
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#0e1320",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={() => ""}
              formatter={(v: number) => [`index ${v}`, ""]}
            />
            <Area type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2.4} fill="url(#perf)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-faint">Illustrative performance index, not actual returns.</p>
    </div>
  );
}
