export type TxnType = "Buy" | "Sell" | "Dividend" | "Deposit";

export interface Txn {
  date: string;
  type: TxnType;
  symbol: string;
  detail: string;
  amount: number; // +inflow to portfolio value / -outflow of cash
}

/** Illustrative transaction ledger (safe to commit). Real history comes from the
 * user's Supabase rows on a live deploy. */
export const TXNS: Txn[] = [
  { date: "2026-06-10", type: "Dividend", symbol: "JNJ", detail: "Quarterly dividend", amount: 13.3 },
  { date: "2026-06-02", type: "Buy", symbol: "VUAG", detail: "2 shares @ 266.7", amount: -533.4 },
  { date: "2026-05-28", type: "Dividend", symbol: "O", detail: "Monthly dividend", amount: 5.1 },
  { date: "2026-05-20", type: "Buy", symbol: "NVDA", detail: "1 share @ 180.0", amount: -180.0 },
  { date: "2026-05-15", type: "Dividend", symbol: "KO", detail: "Quarterly dividend", amount: 10.5 },
  { date: "2026-05-01", type: "Deposit", symbol: "CASH", detail: "Monthly contribution", amount: 500.0 },
  { date: "2026-04-22", type: "Sell", symbol: "O", detail: "5 shares @ 57.0", amount: 285.0 },
  { date: "2026-04-10", type: "Dividend", symbol: "JNJ", detail: "Quarterly dividend", amount: 13.1 },
  { date: "2026-04-01", type: "Buy", symbol: "KO", detail: "6 shares @ 81.5", amount: -489.0 },
  { date: "2026-03-18", type: "Deposit", symbol: "CASH", detail: "Monthly contribution", amount: 500.0 },
];

/** Net-worth points by month (oldest → newest), for the timeline chart. */
export const NET_WORTH_HISTORY: { label: string; value: number }[] = [
  { label: "Sep", value: 7100 },
  { label: "Oct", value: 7650 },
  { label: "Nov", value: 8200 },
  { label: "Dec", value: 8050 },
  { label: "Jan", value: 8900 },
  { label: "Feb", value: 9600 },
  { label: "Mar", value: 9950 },
  { label: "Apr", value: 10650 },
  { label: "May", value: 11200 },
  { label: "Jun", value: 11725 },
];

/** Dividend income booked per quarter. */
export const DIVIDEND_HISTORY: { period: string; amount: number }[] = [
  { period: "Q3 '25", amount: 41 },
  { period: "Q4 '25", amount: 53 },
  { period: "Q1 '26", amount: 62 },
  { period: "Q2 '26", amount: 74 },
];

export function historyStats() {
  const invested = TXNS.filter((t) => t.type === "Buy").reduce((a, t) => a + Math.abs(t.amount), 0);
  const dividends = TXNS.filter((t) => t.type === "Dividend").reduce((a, t) => a + t.amount, 0);
  const deposits = TXNS.filter((t) => t.type === "Deposit").reduce((a, t) => a + t.amount, 0);
  const first = NET_WORTH_HISTORY[0].value;
  const last = NET_WORTH_HISTORY[NET_WORTH_HISTORY.length - 1].value;
  const growthPct = ((last - first) / first) * 100;
  return { invested, dividends, deposits, growthPct, first, last };
}
