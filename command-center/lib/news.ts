export type NewsTone = "bull" | "bear" | "neutral";

export interface NewsItem {
  id: string;
  symbol: string; // related holding ticker, or "MKT" for market-wide
  source: string;
  time: string; // relative
  headline: string;
  summary: string;
  tone: NewsTone;
  tags: string[];
  url?: string;
  image?: string;
}

/**
 * Illustrative, holding-aware headlines (safe to commit - not live market data).
 * On a live deploy these would come from a keyed news API; the "Summarize with AI"
 * button uses the user's Claude key to digest any item against their portfolio.
 */
export const NEWS: NewsItem[] = [
  {
    id: "n1", symbol: "NVDA", source: "Market Wire", time: "12m ago", tone: "bull",
    headline: "Nvidia extends AI data-center lead as new accelerator ships ahead of schedule",
    summary: "Demand commentary stays strong into next quarter; supply is the swing factor. Volatility remains high around each print.",
    tags: ["AI", "Semis", "Earnings"],
  },
  {
    id: "n2", symbol: "JNJ", source: "Healthcare Daily", time: "48m ago", tone: "neutral",
    headline: "Johnson & Johnson reaffirms dividend, 64th consecutive annual increase on track",
    summary: "Free cash flow comfortably covers the payout. Litigation overhang persists but is largely reserved for.",
    tags: ["Dividend", "Healthcare", "Defensive"],
  },
  {
    id: "n3", symbol: "O", source: "REIT Observer", time: "2h ago", tone: "bear",
    headline: "Realty Income pressured as higher-for-longer rates weigh on REIT valuations",
    summary: "Monthly dividend intact, but rate sensitivity caps upside. Watch occupancy and the payout ratio.",
    tags: ["REIT", "Rates", "Income"],
  },
  {
    id: "n4", symbol: "MKT", source: "Macro Brief", time: "3h ago", tone: "neutral",
    headline: "Inflation cools modestly; market trims rate-cut bets for the next meeting",
    summary: "Bond yields drift; rate-sensitive sectors (REITs, long-duration tech) react most. Broad index funds steady.",
    tags: ["Macro", "Rates", "Inflation"],
  },
  {
    id: "n5", symbol: "KO", source: "Consumer Tape", time: "5h ago", tone: "bull",
    headline: "Coca-Cola pricing power holds as volumes stabilize across key regions",
    summary: "Pricing offsets soft volume; dividend streak (24+ years) underpins the defensive case.",
    tags: ["Dividend", "Staples", "Pricing"],
  },
  {
    id: "n6", symbol: "VUAG", source: "Index Watch", time: "6h ago", tone: "neutral",
    headline: "S&P 500 grinds near highs; breadth narrows toward megacap leaders",
    summary: "Concentration in the top names rises. A low-cost index core captures it without single-stock risk.",
    tags: ["Index", "S&P 500", "Breadth"],
  },
];

export const NEWS_SYMBOLS = ["All", "MKT", "VUAG", "JNJ", "KO", "NVDA", "O"] as const;
