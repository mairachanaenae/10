import { Briefcase, Home, Landmark, Wallet } from "lucide-react";
import type { Goal, Holding } from "./types";

/**
 * SAMPLE portfolio (generic dividend stocks) — safe to commit/publish.
 * A real user's holdings come from Supabase (per Clerk user) and are never committed.
 */
export const SAMPLE_HOLDINGS: Holding[] = [
  { symbol: "VUAG", name: "Vanguard S&P 500", shares: 12, value: 3200, dayGain: 41, dayPct: 1.3, assetClass: "ETF",
    stats: { payout: 32, de: 0, years: 12, yield: 1.3 }, hist: [2780, 2860, 2910, 3010, 3120, 3060, 3200] },
  { symbol: "JNJ", name: "Johnson & Johnson", shares: 14, value: 2410, dayGain: 18, dayPct: 0.75, assetClass: "Stock",
    stats: { payout: 60, de: 67, years: 64, yield: 2.2 }, hist: [2120, 2180, 2250, 2310, 2360, 2380, 2410] },
  { symbol: "KO", name: "Coca-Cola", shares: 22, value: 1815, dayGain: 22, dayPct: 1.25, assetClass: "Stock",
    stats: { payout: 65, de: 124.9, years: 24, yield: 2.57 }, hist: [1660, 1700, 1690, 1740, 1780, 1760, 1815] },
  { symbol: "NVDA", name: "Nvidia", shares: 9, value: 1620, dayGain: 31, dayPct: 1.95, assetClass: "Stock",
    stats: { payout: 5, de: 22, years: 1, yield: 0.3 }, hist: [980, 1120, 1240, 1180, 1410, 1500, 1620] },
  { symbol: "O", name: "Realty Income", shares: 20, value: 1180, dayGain: -6, dayPct: -0.5, assetClass: "Stock",
    stats: { payout: 265, de: 73, years: 2, yield: 5.2 }, hist: [1090, 1120, 1080, 1140, 1160, 1130, 1180] },
  { symbol: "CASH", name: "Cash reserve", shares: 1, value: 1500, dayGain: 0, dayPct: 0, assetClass: "Cash" },
];

export const SAMPLE_GOALS: Goal[] = [
  { id: "g1", title: "$100k portfolio", icon: Briefcase, current: 11725, target: 100000, forecast: "2031", unit: "currency" },
  { id: "g2", title: "Financial freedom", icon: Landmark, current: 47, target: 100, forecast: "2040", unit: "score" },
  { id: "g3", title: "Dividend income / yr", icon: Wallet, current: 320, target: 5000, forecast: "2035", unit: "currency" },
  { id: "g4", title: "First rental property", icon: Home, current: 11725, target: 300000, forecast: "2034", unit: "currency" },
];

export interface PortfolioSummary {
  total: number;
  dayGain: number;
  dayPct: number;
  netWorth: number;
  cash: number;
  best: Holding;
  freedomScore: number;
}

export function summarize(holdings: Holding[]): PortfolioSummary {
  const invested = holdings.filter((h) => h.assetClass !== "Cash");
  const total = invested.reduce((a, h) => a + h.value, 0);
  const cash = holdings.filter((h) => h.assetClass === "Cash").reduce((a, h) => a + h.value, 0);
  const dayGain = invested.reduce((a, h) => a + h.dayGain, 0);
  const base = total - dayGain;
  const dayPct = base ? (dayGain / base) * 100 : 0;
  const netWorth = total + cash;
  const best = [...invested].sort((a, b) => b.dayPct - a.dayPct)[0];
  const freedomScore = Math.min(99, Math.round((netWorth / 100000) * 100 * 4));
  return { total, dayGain, dayPct, netWorth, cash, best, freedomScore };
}
