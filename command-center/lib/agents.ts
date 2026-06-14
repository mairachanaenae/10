// Headless, explainable agent behaviors over the portfolio. Pure + testable;
// the UI renders the result and routes any proposal through the approval queue.
import type { Position } from "./holdings-store";
import { computeMetrics, needsRebalance, type PortfolioMetrics } from "./analytics";

export interface AgentProposal {
  title: string;
  why: string;
  confidence: number;
  payload: Record<string, unknown>;
}
export interface AgentResult {
  summary: string; // one-line headline
  detail: string; // plain-English explanation
  confidence: number; // 0-1, deliberately capped (never 100%)
  evidence: string[]; // the numbers behind it
  tone: "good" | "warn" | "bad";
  proposal?: AgentProposal;
}

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

/** Messenger/Summarizer: a plain-language snapshot of the book. */
export function summarizer(holdings: Position[], m: PortfolioMetrics): AgentResult {
  const best = m.positions.reduce((a, b) => (b.weight > a.weight ? b : a), m.positions[0]);
  const movers = holdings
    .filter((h) => Math.abs(h.chg ?? 0) >= 1)
    .sort((a, b) => Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0))
    .slice(0, 2)
    .map((h) => `${h.sym} ${pct(h.chg ?? 0)}`);
  return {
    summary: `Portfolio ${pct(m.dayChangePct)} today, $${Math.round(m.total).toLocaleString()} across ${holdings.length} positions.`,
    detail:
      `Your largest position is ${best?.sym} at ${best?.weight.toFixed(0)}% of the book. ` +
      (movers.length ? `Biggest movers: ${movers.join(", ")}. ` : "Quiet day, little movement. ") +
      `Concentration is ${m.concentrationLabel.toLowerCase()}.`,
    confidence: 0.8,
    evidence: [
      `Total $${Math.round(m.total).toLocaleString()}`,
      `Day ${pct(m.dayChangePct)}`,
      `Top weight ${m.topWeight.toFixed(0)}%`,
      `HHI ${m.hhi.toFixed(0)}`,
    ],
    tone: m.dayChangePct >= 0 ? "good" : "warn",
  };
}

/** Anomaly flagger: unusual day moves + positions under water vs cost. */
export function anomalyFlagger(holdings: Position[]): AgentResult {
  const bigMoves = holdings.filter((h) => Math.abs(h.chg ?? 0) >= 4);
  const underwater = holdings.filter((h) => h.cost && h.px < h.cost * 0.9);
  const flags: string[] = [
    ...bigMoves.map((h) => `${h.sym} moved ${pct(h.chg ?? 0)} today`),
    ...underwater.map((h) => `${h.sym} is ${pct(((h.px - (h.cost ?? h.px)) / (h.cost ?? h.px)) * 100)} vs cost`),
  ];
  const any = flags.length > 0;
  return {
    summary: any ? `${flags.length} anomaly${flags.length > 1 ? "ies" : ""} flagged` : "No anomalies detected",
    detail: any
      ? `Worth a look: ${flags.join("; ")}. Large single-day moves and deep drawdowns vs your cost basis are worth understanding before acting.`
      : "No position moved more than 4% today and none is more than 10% below cost. Nothing unusual.",
    confidence: 0.75,
    evidence: flags.length ? flags : ["All positions within normal ranges"],
    tone: any ? "warn" : "good",
  };
}

/** Steward: drift + concentration risk, with an approvable rebalance note. */
export function stewardReport(m: PortfolioMetrics): AgentResult {
  const over = needsRebalance(m, 5) && m.maxDrift;
  if (!over || !m.maxDrift) {
    return {
      summary: "Portfolio on target",
      detail: `No position drifts more than 5 points from target. Concentration is ${m.concentrationLabel.toLowerCase()} (top weight ${m.topWeight.toFixed(0)}%).`,
      confidence: 0.9,
      evidence: [`Total drift ${m.totalDrift.toFixed(1)}pp`, `Top weight ${m.topWeight.toFixed(0)}%`],
      tone: "good",
    };
  }
  const d = m.maxDrift;
  const trim = d.drift > 0;
  return {
    summary: `${trim ? "Trim" : "Add to"} ${d.sym} toward its ${d.target}% target`,
    detail: `${d.sym} is ${d.weight.toFixed(0)}% vs a ${d.target}% target (${d.drift > 0 ? "+" : ""}${d.drift.toFixed(0)}pp). Concentration is ${m.concentrationLabel.toLowerCase()}.`,
    confidence: Math.min(0.85, 0.5 + Math.abs(d.drift) / 100),
    evidence: [`${d.sym} weight ${d.weight.toFixed(0)}%`, `target ${d.target}%`, `drift ${d.drift > 0 ? "+" : ""}${d.drift.toFixed(0)}pp`],
    tone: Math.abs(d.drift) >= 10 ? "bad" : "warn",
    proposal: {
      title: `${trim ? "Trim" : "Add to"} ${d.sym} toward its ${d.target}% target`,
      why: `${d.sym} drifts ${d.drift > 0 ? "+" : ""}${d.drift.toFixed(0)}pp from target. Approving logs the recommendation to your audit trail; it does not place a trade.`,
      confidence: Math.min(0.85, 0.5 + Math.abs(d.drift) / 100),
      payload: { sym: d.sym },
    },
  };
}

export { computeMetrics };
