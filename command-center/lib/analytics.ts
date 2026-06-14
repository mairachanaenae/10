// Pure decision-support analytics over positions. No I/O, fully unit-testable.
import type { Position } from "./holdings-store";

export interface PositionMetric {
  sym: string;
  value: number;
  weight: number; // % of portfolio
  target: number; // % target
  drift: number; // weight - target (signed)
  pnlPct?: number; // vs cost basis
}

export interface PortfolioMetrics {
  total: number;
  dayChangePct: number;
  positions: PositionMetric[];
  topWeight: number; // largest single-position weight %
  hhi: number; // Herfindahl-Hirschman concentration index (0-10000)
  concentrationLabel: "Diversified" | "Moderate" | "Concentrated";
  totalDrift: number; // sum of absolute drift / 2 (one-sided turnover to fix)
  maxDrift: PositionMetric | null; // position furthest from target
}

export function computeMetrics(holdings: Position[]): PortfolioMetrics {
  const valued = holdings.map((h) => ({ ...h, value: h.sh * h.px }));
  const total = valued.reduce((a, h) => a + h.value, 0) || 1;
  const positions: PositionMetric[] = valued.map((h) => {
    const weight = (h.value / total) * 100;
    const target = h.target ?? 0;
    return {
      sym: h.sym,
      value: h.value,
      weight,
      target,
      drift: weight - target,
      pnlPct: h.cost ? ((h.px - h.cost) / h.cost) * 100 : undefined,
    };
  });
  const dayChangePct =
    valued.reduce((a, h) => a + h.value * ((h.chg ?? 0) / 100), 0) / total * 100;
  const weights = positions.map((p) => p.weight);
  const topWeight = weights.length ? Math.max(...weights) : 0;
  const hhi = weights.reduce((a, w) => a + w * w, 0); // 0-10000
  const concentrationLabel = hhi > 4000 ? "Concentrated" : hhi > 2500 ? "Moderate" : "Diversified";
  const totalDrift = positions.reduce((a, p) => a + Math.abs(p.drift), 0) / 2;
  const maxDrift = positions.length
    ? positions.reduce((m, p) => (Math.abs(p.drift) > Math.abs(m.drift) ? p : m))
    : null;
  return { total, dayChangePct, positions, topWeight, hhi, concentrationLabel, totalDrift, maxDrift };
}

/** Rebalance is only suggested when the worst drift exceeds the band (default 5pp). */
export function needsRebalance(m: PortfolioMetrics, bandPct = 5): boolean {
  return !!m.maxDrift && Math.abs(m.maxDrift.drift) >= bandPct;
}
