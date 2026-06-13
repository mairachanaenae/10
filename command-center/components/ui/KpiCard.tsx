"use client";

import { motion } from "framer-motion";
import { Counter } from "./Counter";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  icon: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  tone?: "emerald" | "gold" | "blue" | "danger" | "ink";
  ring?: number; // 0-100, renders a progress ring instead of a counter
}

const toneClass: Record<NonNullable<Kpi["tone"]>, string> = {
  emerald: "text-emerald",
  gold: "text-gold",
  blue: "text-blue",
  danger: "text-danger",
  ink: "text-ink",
};

export function KpiCard({ kpi, index = 0 }: { kpi: Kpi; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
        <span>{kpi.icon}</span>
        {kpi.label}
      </div>
      {kpi.ring != null ? (
        <div className="mt-3 flex items-center gap-3">
          <div
            className="grid h-[54px] w-[54px] place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--emerald) ${kpi.ring}%, rgba(255,255,255,.08) 0)`,
            }}
          >
            <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-surface font-display text-sm font-bold">
              {kpi.ring}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("mt-2 font-display text-2xl font-bold", toneClass[kpi.tone ?? "ink"])}>
          <Counter
            to={kpi.value}
            decimals={kpi.decimals}
            prefix={kpi.prefix}
            suffix={kpi.suffix}
          />
        </div>
      )}
      {kpi.sub ? <div className="mt-1.5 text-[12.5px] text-muted">{kpi.sub}</div> : null}
    </motion.div>
  );
}
