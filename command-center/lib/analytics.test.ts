import { describe, it, expect } from "vitest";
import { computeMetrics, needsRebalance } from "./analytics";
import type { Position } from "./holdings-store";

const mk = (sym: string, sh: number, px: number, target: number, chg = 0): Position => ({
  sym, name: sym, sh, px, target, chg, tone: "#fff",
});

describe("computeMetrics", () => {
  it("computes weights, drift and total", () => {
    const m = computeMetrics([mk("A", 1, 60, 50), mk("B", 1, 40, 50)]);
    expect(m.total).toBe(100);
    const a = m.positions.find((p) => p.sym === "A")!;
    expect(a.weight).toBeCloseTo(60);
    expect(a.drift).toBeCloseTo(10); // 60 - 50
    expect(m.maxDrift?.sym).toBe("A");
  });

  it("flags concentration via HHI", () => {
    const conc = computeMetrics([mk("A", 1, 90, 100), mk("B", 1, 10, 0)]);
    expect(conc.topWeight).toBeCloseTo(90);
    expect(conc.concentrationLabel).toBe("Concentrated");
    const diversified = computeMetrics([
      mk("A", 1, 20, 20), mk("B", 1, 20, 20), mk("C", 1, 20, 20), mk("D", 1, 20, 20), mk("E", 1, 20, 20),
    ]);
    expect(diversified.concentrationLabel).toBe("Diversified");
  });

  it("computes day change from per-position chg", () => {
    const m = computeMetrics([mk("A", 1, 100, 100, 2)]);
    expect(m.dayChangePct).toBeCloseTo(2);
  });

  it("needsRebalance respects the band", () => {
    const m = computeMetrics([mk("A", 1, 56, 50), mk("B", 1, 44, 50)]); // drift 6
    expect(needsRebalance(m, 5)).toBe(true);
    expect(needsRebalance(m, 8)).toBe(false);
  });
});
