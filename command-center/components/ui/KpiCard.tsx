"use client";

import { Banknote, Diamond, Gauge, Rocket, TrendingUp } from "lucide-react";
import { Counter } from "./Counter";
import { cn } from "@/lib/utils";

// keyed registry so a Server Component can pass a string (functions can't cross the boundary)
const ICONS = { networth: Diamond, portfolio: TrendingUp, cashflow: Banknote, freedom: Gauge, growth: Rocket };
export type KpiIcon = keyof typeof ICONS;

export interface Kpi {
  label: string;
  icon: KpiIcon;
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

const toneGlow: Record<NonNullable<Kpi["tone"]>, string> = {
  emerald: "bg-emerald/[0.12] text-emerald",
  gold: "bg-gold/[0.12] text-gold",
  blue: "bg-blue/[0.12] text-blue",
  danger: "bg-danger/[0.12] text-danger",
  ink: "bg-white/[0.06] text-ink",
};

export function KpiCard({ kpi, index = 0 }: { kpi: Kpi; index?: number }) {
  const Icon = ICONS[kpi.icon];
  const tone = kpi.tone ?? "ink";
  return (
    <div
      className="sheen animate-fade glass p-5 transition duration-300 hover:-translate-y-[3px] hover:shadow-[0_30px_70px_-28px_rgba(2,6,20,0.9)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{kpi.label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-[10px]", toneGlow[tone])}>
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </span>
      </div>
      {kpi.ring != null ? (
        <div className="mt-4 flex items-center gap-3">
          <div
            className="grid h-[54px] w-[54px] place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--blue) ${kpi.ring}%, rgba(255,255,255,.08) 0)` }}
          >
            <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-surface font-display text-sm font-bold">
              {kpi.ring}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("mt-3 font-display text-2xl font-bold tracking-tight", toneClass[tone])}>
          <Counter to={kpi.value} decimals={kpi.decimals} prefix={kpi.prefix} suffix={kpi.suffix} />
        </div>
      )}
      {kpi.sub ? <div className="mt-1.5 text-[12.5px] text-muted">{kpi.sub}</div> : null}
    </div>
  );
}
