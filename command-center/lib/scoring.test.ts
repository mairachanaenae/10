import { describe, expect, it } from "vitest";
import { breakdown, rank, score } from "./scoring";

describe("dividend-safety scoring", () => {
  it("scores a sturdy dividend king highly (JNJ-like)", () => {
    const s = score({ payout: 60, de: 67, years: 64, yield: 2.2 });
    expect(s).toBe(24 + 18 + 25 + 20); // 87
    expect(rank(s)).toBe("S");
  });

  it("penalizes a stretched, indebted, short-record payer (O-like)", () => {
    const s = score({ payout: 265, de: 73, years: 2, yield: 5.2 });
    expect(s).toBeLessThan(40);
    expect(["D", "E"]).toContain(rank(s));
  });

  it("breakdown sums to the total score", () => {
    const v = { payout: 65, de: 124.9, years: 24, yield: 2.57 };
    const b = breakdown(v);
    expect(b.cover + b.debt + b.record + b.yieldSafety).toBe(score(v));
  });

  it("maps rank thresholds correctly", () => {
    expect(rank(80)).toBe("S");
    expect(rank(68)).toBe("A");
    expect(rank(54)).toBe("B");
    expect(rank(40)).toBe("C");
    expect(rank(26)).toBe("D");
    expect(rank(10)).toBe("E");
  });
});
