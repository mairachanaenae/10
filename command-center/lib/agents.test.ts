import { describe, it, expect } from "vitest";
import { summarizer, anomalyFlagger, stewardReport } from "./agents";
import { computeMetrics } from "./analytics";
import type { Position } from "./holdings-store";

const mk = (sym: string, sh: number, px: number, target: number, chg = 0, cost?: number): Position => ({
  sym, name: sym, sh, px, target, chg, cost, tone: "#fff",
});

describe("agents", () => {
  it("steward proposes a rebalance only when over the band", () => {
    const drifted = computeMetrics([mk("A", 1, 70, 50), mk("B", 1, 30, 50)]);
    const r = stewardReport(drifted);
    expect(r.proposal).toBeTruthy();
    expect(r.proposal!.payload.sym).toBe("A");
    expect(r.confidence).toBeLessThan(1); // never overconfident

    const onTarget = computeMetrics([mk("A", 1, 50, 50), mk("B", 1, 50, 50)]);
    expect(stewardReport(onTarget).proposal).toBeUndefined();
  });

  it("anomaly flags big moves and underwater positions", () => {
    const r = anomalyFlagger([mk("A", 1, 100, 50, 6), mk("B", 1, 80, 50, 0, 100)]);
    expect(r.tone).toBe("warn");
    expect(r.evidence.length).toBeGreaterThanOrEqual(2);
    expect(anomalyFlagger([mk("A", 1, 100, 50, 0.5)]).summary).toMatch(/No anomalies/);
  });

  it("summarizer reports day change and never claims certainty", () => {
    const m = computeMetrics([mk("A", 1, 100, 100, 2)]);
    const r = summarizer([mk("A", 1, 100, 100, 2)], m);
    expect(r.summary).toContain("+2.0%");
    expect(r.confidence).toBeLessThan(1);
  });
});
