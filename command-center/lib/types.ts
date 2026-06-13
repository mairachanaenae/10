export type AssetClass = "ETF" | "Stock" | "Cash" | "Crypto" | "RealEstate" | "Business";

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  value: number;
  dayGain: number;
  dayPct: number;
  assetClass: AssetClass;
  /** Optional dividend metrics used by the safety score (mostly for dividend stocks). */
  stats?: DividendStats;
  /** ~12 point price history for sparklines. */
  hist?: number[];
}

export interface DividendStats {
  payout: number; // %
  de: number; // debt-to-equity
  years: number; // years of non-decreasing dividends
  yield: number; // %
}

export interface Goal {
  id: string;
  title: string;
  icon: string;
  current: number;
  target: number;
  forecast: string;
  unit?: "score" | "currency";
}
