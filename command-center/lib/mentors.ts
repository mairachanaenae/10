import type { DividendStats } from "./types";

/** Shared rules appended to every mentor's system prompt (ported from
 * examples/ag2-autonomous-claude/investing_mentors.py:48-55). */
export const HOUSE_RULES =
  " Teach principles and how to reason, not hot tips. Keep it plain and beginner-friendly. " +
  "When you discuss a company's future, think in scenarios and always flag the uncertainty — " +
  "never promise an outcome. If real numbers are provided, reason about them specifically. " +
  "Keep each reply short (a few sentences). Educational only — never financial advice.";

export interface Mentor {
  id: string;
  name: string;
  emoji: string;
  focus: string;
  tags: string[];
  systemPrompt: string;
  /** Offline rule-based reply (used when no AI key is configured). */
  fallback: (q: string) => string;
}

function pick(q: string, m: Record<string, string>): string {
  const s = q.toLowerCase();
  for (const k of Object.keys(m)) if (k !== "def" && s.includes(k)) return m[k];
  if (/buy|sell|should i/.test(s))
    return "I can't tell you to buy or sell — but here's how I'd weigh it. " + m.def;
  return m.def;
}

/** The four Mentor-Hub personas from the spec. */
export const MENTORS: Mentor[] = [
  {
    id: "lt",
    name: "Long-Term Investor",
    emoji: "🌱",
    focus: "Compound growth · dividends · preservation",
    tags: ["Compounding", "Dividends", "Patience"],
    systemPrompt:
      "You are a long-term, buy-and-hold investor in the spirit of Warren Buffett. You favor " +
      "wonderful businesses with durable moats and steady, growing dividends, held for decades." +
      HOUSE_RULES,
    fallback: (q) =>
      pick(q, {
        div: "Dividends that grow for decades are the engine of compounding — reinvest and let time work.",
        nvda: "NVDA is exciting, but for a long-term core I lean on broad index funds I'd happily hold for 20 years.",
        risk: "Time in the market beats timing it. Your biggest long-term risk is selling in a panic.",
        def: "Buy quality, reinvest, hold. A low-cost index core is something I'd never sell.",
      }),
  },
  {
    id: "gr",
    name: "Growth Investor",
    emoji: "🚀",
    focus: "Innovation · high-growth · trends",
    tags: ["Innovation", "Momentum", "Tech"],
    systemPrompt:
      "You are a growth investor in the spirit of Peter Lynch's appetite for winners. You back " +
      "durable trends and innovative leaders, while respecting valuation and volatility." +
      HOUSE_RULES,
    fallback: (q) =>
      pick(q, {
        nvda: "NVDA sits at the center of the AI buildout — high reward, high volatility. Size it so a 30% drop won't hurt.",
        div: "Dividends are fine, but reinvesting into durable winners can compound faster early on.",
        risk: "Growth means drawdowns. Conviction plus position sizing is how you survive them.",
        def: "Look for durable trends — AI, energy, healthcare innovation — and ride the leaders.",
      }),
  },
  {
    id: "va",
    name: "Value Investor",
    emoji: "🛡️",
    focus: "Undervalued · margin of safety · fundamentals",
    tags: ["Margin of safety", "Valuation", "Patience"],
    systemPrompt:
      "You are a value investor in the spirit of Benjamin Graham. You insist on a margin of " +
      "safety, separate price from value, and avoid overpaying for even great businesses." +
      HOUSE_RULES,
    fallback: (q) =>
      pick(q, {
        nvda: "At a rich multiple, NVDA gives little margin of safety. I'd want a cheaper entry or a smaller bet.",
        div: "A growing dividend backed by real free cash flow is a value investor's friend.",
        risk: "Risk is paying too much for a good business. Demand a margin of safety.",
        def: "Price is what you pay, value is what you get. Buy great businesses when they're on sale.",
      }),
  },
  {
    id: "ma",
    name: "Macro Strategist",
    emoji: "🌍",
    focus: "Cycles · rates · global",
    tags: ["Rates", "Cycles", "Global"],
    systemPrompt:
      "You are a macro strategist. You think in economic cycles, interest rates, inflation and " +
      "global flows, and how they shape asset prices and diversification." +
      HOUSE_RULES,
    fallback: (q) =>
      pick(q, {
        nvda: "Tech is rate-sensitive — if rates stay high, rich valuations get pressured. Watch the macro backdrop.",
        div: "In a higher-for-longer world, durable dividends and cash flows matter more.",
        risk: "The biggest risks are macro: rates, inflation, liquidity. Diversify across regions.",
        def: "Think in cycles. Balance growth with assets that hold up if the economy slows.",
      }),
  },
];

export function getMentor(id: string): Mentor | undefined {
  return MENTORS.find((m) => m.id === id);
}

/** Per-holding "council" reactions, ported from web/dashboard.py:382-389. */
export interface CouncilOpinion {
  name: string;
  emoji: string;
  text: string;
  tone: "good" | "warn" | "bad";
}

export function councilReactions(v: DividendStats, s: number): CouncilOpinion[] {
  return [
    {
      name: "Buffett",
      emoji: "💰",
      text:
        v.payout <= 60 && v.years >= 10
          ? "Earnings comfortably cover a long-rising dividend — the durable kind I like."
          : v.payout > 90
            ? "The payout leaves almost no cushion; I'd want more cover."
            : "Decent — I'd check the moat protects these earnings over a decade.",
      tone: v.payout <= 60 && v.years >= 10 ? "good" : v.payout > 90 ? "bad" : "warn",
    },
    {
      name: "Munger",
      emoji: "🧠",
      text:
        v.de > 150 || v.payout > 90
          ? "Invert it: high debt and a stretched payout are what snap a dividend. Avoid that combo."
          : "Few obvious ways this breaks — low-ish debt and a sane payout.",
      tone: v.de > 150 || v.payout > 90 ? "bad" : "good",
    },
    {
      name: "Lynch",
      emoji: "🛒",
      text:
        v.yield > 8
          ? "A yield that high usually means the market expects a cut. Be careful."
          : "Understandable and steady — just don't overpay for it.",
      tone: v.yield > 8 ? "warn" : "good",
    },
    {
      name: "Graham",
      emoji: "🛡️",
      text:
        v.years >= 20
          ? "A long, unbroken record — the defensive investor's friend."
          : v.years < 5
            ? "Too short a record to lean on yet."
            : "A fair record; insist on a margin of safety.",
      tone: v.years >= 20 ? "good" : "warn",
    },
    {
      name: "Risk",
      emoji: "⚠️",
      text:
        v.yield > 8
          ? "That yield smells like a trap — size it very small."
          : v.de > 250
            ? "Heavy debt — a downturn could force a cut."
            : "Diversify and size it small regardless.",
      tone: v.yield > 8 || v.de > 250 ? "bad" : "warn",
    },
    {
      name: "Analyst",
      emoji: "📊",
      text: `Score ${s}/100 — ${s >= 70 ? "sturdy" : s >= 45 ? "watch it" : "fragile"}. One holding among many; nothing here is guaranteed.`,
      tone: s >= 70 ? "good" : s >= 45 ? "warn" : "bad",
    },
  ];
}
