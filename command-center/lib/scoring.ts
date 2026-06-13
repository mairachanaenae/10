import type { DividendStats } from "./types";

export type Rank = "S" | "A" | "B" | "C" | "D" | "E";

/**
 * Dividend-safety score (0-100). Ported verbatim from the prototype
 * (examples/ag2-autonomous-claude/web/build_static.py:246-253).
 * Four dimensions: payout coverage (30), debt (25), dividend record (25), yield-trap (20).
 */
export function score(v: DividendStats): number {
  let s = 0;
  s += v.payout <= 40 ? 30 : v.payout <= 60 ? 24 : v.payout <= 75 ? 15 : v.payout <= 90 ? 6 : 0;
  s += v.de <= 50 ? 25 : v.de <= 100 ? 18 : v.de <= 150 ? 10 : v.de <= 250 ? 4 : 0;
  s += v.years >= 25 ? 25 : v.years >= 10 ? 18 : v.years >= 5 ? 10 : v.years >= 1 ? 4 : 0;
  s += v.yield <= 5 ? 20 : v.yield <= 7 ? 12 : v.yield <= 10 ? 5 : 0;
  return Math.round(s);
}

/** E→S rank from a score (dashboard.py:280). */
export function rank(s: number): Rank {
  return s >= 80 ? "S" : s >= 68 ? "A" : s >= 54 ? "B" : s >= 40 ? "C" : s >= 26 ? "D" : "E";
}

export interface ScoreBreakdown {
  cover: number;
  debt: number;
  record: number;
  yieldSafety: number;
}

export function breakdown(v: DividendStats): ScoreBreakdown {
  return {
    cover: v.payout <= 40 ? 30 : v.payout <= 60 ? 24 : v.payout <= 75 ? 15 : v.payout <= 90 ? 6 : 0,
    debt: v.de <= 50 ? 25 : v.de <= 100 ? 18 : v.de <= 150 ? 10 : v.de <= 250 ? 4 : 0,
    record: v.years >= 25 ? 25 : v.years >= 10 ? 18 : v.years >= 5 ? 10 : v.years >= 1 ? 4 : 0,
    yieldSafety: v.yield <= 5 ? 20 : v.yield <= 7 ? 12 : v.yield <= 10 ? 5 : 0,
  };
}

export const RANK_MAX: Record<keyof ScoreBreakdown, number> = {
  cover: 30,
  debt: 25,
  record: 25,
  yieldSafety: 20,
};
