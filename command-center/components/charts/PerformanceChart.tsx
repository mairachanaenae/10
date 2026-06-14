"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NET_WORTH_HISTORY } from "@/lib/history";

const FRAMES = ["3M", "6M", "All"] as const;
type Frame = (typeof FRAMES)[number];

const TAKE: Record<Frame, number> = { "3M": 3, "6M": 6, All: NET_WORTH_HISTORY.length };

export function PerformanceChart() {
  const [frame, setFrame] = useState<Frame>("All");
  const data = useMemo(() => NET_WORTH_HISTORY.slice(-TAKE[frame]), [frame]);
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        {FRAMES.map((f) => (
          <button
            key={f}
            onClick={() => setFrame(f)}
            className={
              "rounded-lg border px-3 py-1 text-[12px] transition " +
              (f === frame
                ? "border-line2 bg-white/[0.07] text-ink"
                : "border-line text-muted hover:text-ink")
            }
          >
            {f}
          </button>
        ))}
        <span className={"ml-auto text-[12px] tnum " + (change >= 0 ? "text-emerald" : "text-danger")}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ea8fe" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6ea8fe" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={["dataMin - 400", "dataMax + 400"]} tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} width={46} />
            <Tooltip
              contentStyle={{
                background: "#0e1320",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [`NOK ${v.toLocaleString()}`, "net worth"]}
            />
            <Area type="monotone" dataKey="value" stroke="#6ea8fe" strokeWidth={2.4} fill="url(#perf)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[11px] text-faint">Net-worth trajectory over the last {NET_WORTH_HISTORY.length} months.</p>
    </div>
  );
}
