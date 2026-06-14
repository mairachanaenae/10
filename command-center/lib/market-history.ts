/**
 * Actual financial-market history — major events and what they teach investors today.
 * Figures are approximate, well-documented historical values (peak-to-trough drawdowns,
 * recovery times) — illustrative, not to-the-decimal precise.
 */
export interface MarketEvent {
  id: string;
  year: string;
  name: string;
  drawdown: number; // approx peak-to-trough % decline (index)
  recovery: string; // how long to regain the prior peak
  what: string; // what happened
  lessonToday: string; // how it informs investing now
  tags: string[];
}

export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: "1929",
    year: "1929–32",
    name: "Wall Street Crash & Great Depression",
    drawdown: 86,
    recovery: "~25 years (Dow regained 1929 peak in 1954)",
    what: "A speculative, heavily-margined bull market collapsed. The Dow fell about 86% into 1932 as banks failed and the economy entered the Great Depression.",
    lessonToday: "Leverage turns a drawdown into ruin. Owning quality broadly and avoiding margin is how you survive a once-in-a-generation shock.",
    tags: ["Crash", "Leverage", "Deflation"],
  },
  {
    id: "1973",
    year: "1973–74",
    name: "Oil Shock Bear Market",
    drawdown: 48,
    recovery: "~2 years",
    what: "An OPEC oil embargo plus high inflation ('stagflation') drove a roughly 48% decline in US stocks while prices kept rising.",
    lessonToday: "Inflation and energy shocks punish richly-valued growth. Real assets, pricing power, and dividends hold up better when cash loses value.",
    tags: ["Inflation", "Energy", "Stagflation"],
  },
  {
    id: "1987",
    year: "1987",
    name: "Black Monday",
    drawdown: 34,
    recovery: "~2 years",
    what: "On 19 Oct 1987 the Dow fell about 22.6% in a single day — the worst one-day drop in history — amplified by program trading and portfolio insurance.",
    lessonToday: "Single-day crashes are unpredictable and largely unforecastable. Reacting in panic locks in the loss; the market recovered within two years.",
    tags: ["Flash crash", "Liquidity", "Panic"],
  },
  {
    id: "2000",
    year: "2000–02",
    name: "Dot-com Bust",
    drawdown: 78,
    recovery: "~15 years (Nasdaq)",
    what: "Internet euphoria pushed valuations to extremes. The Nasdaq fell about 78% as profitless tech companies collapsed.",
    lessonToday: "Story stocks at any price are dangerous. Even a great theme (the internet) destroys capital when you overpay — valuation still matters.",
    tags: ["Bubble", "Tech", "Valuation"],
  },
  {
    id: "2008",
    year: "2007–09",
    name: "Global Financial Crisis",
    drawdown: 57,
    recovery: "~4 years",
    what: "A US housing and subprime-mortgage collapse froze credit markets. The S&P 500 fell about 57% before bottoming in March 2009.",
    lessonToday: "Systemic risk hides in 'safe' assets and debt. Diversification across asset classes and a cash buffer let you hold through the worst of it.",
    tags: ["Credit", "Housing", "Systemic"],
  },
  {
    id: "2020",
    year: "2020",
    name: "COVID-19 Crash",
    drawdown: 34,
    recovery: "~5 months",
    what: "Pandemic lockdowns triggered the fastest 30%+ drop on record (about 33 days), followed by an equally rapid, stimulus-fueled recovery.",
    lessonToday: "The fastest crashes can have the fastest recoveries. Selling at the bottom in March 2020 meant missing the rebound — time in the market won.",
    tags: ["Pandemic", "Speed", "Stimulus"],
  },
  {
    id: "2022",
    year: "2022",
    name: "Inflation & Rate Shock",
    drawdown: 25,
    recovery: "~1.5 years",
    what: "The sharpest Fed rate-hiking cycle in decades repriced everything. The S&P fell about 25% and long-duration tech and bonds fell together.",
    lessonToday: "When rates rise fast, the most rate-sensitive holdings (long-duration tech, REITs, long bonds) hurt most — exactly what's worth watching now.",
    tags: ["Rates", "Duration", "Repricing"],
  },
];
