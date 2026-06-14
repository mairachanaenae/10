import { SAMPLE_HOLDINGS, summarize } from "./sample-data";

/** A compact text snapshot of the (sample) portfolio that we hand to Claude as
 * grounding context so mentors/agents reason about real positions, not vagaries. */
export function portfolioContext(): string {
  const s = summarize(SAMPLE_HOLDINGS);
  const lines = SAMPLE_HOLDINGS.map((h) => {
    const st = h.stats
      ? ` payout ${h.stats.payout}% · D/E ${h.stats.de} · ${h.stats.years}y streak · yield ${h.stats.yield}%`
      : "";
    return `- ${h.symbol} (${h.name}) ${h.assetClass} · $${h.value} · today ${h.dayPct >= 0 ? "+" : ""}${h.dayPct}%${st}`;
  });
  return [
    `Net worth $${s.netWorth.toLocaleString()} · invested $${s.total.toLocaleString()} · cash $${s.cash.toLocaleString()} · freedom score ${s.freedomScore}/100.`,
    "Holdings:",
    ...lines,
  ].join("\n");
}
