"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Holding } from "@/lib/types";

const COLORS = ["#6ea8fe", "#9d8bf6", "#22d3ee", "#e9c46a", "#fb7185", "#22d3ee"];

export function AllocationDonut({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((a, h) => a + h.value, 0) || 1;
  const data = holdings.map((h) => ({ name: h.symbol, value: h.value }));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-[170px] flex-1">
        {holdings.map((h, i) => (
          <div
            key={h.symbol}
            className="flex items-center gap-2.5 border-b border-line py-2 text-[13px] last:border-0"
          >
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="font-medium">{h.symbol}</span>
            <span className="text-muted">{h.name}</span>
            <span className="ml-auto font-semibold tnum">
              {((h.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
