// Live quotes via Finnhub (browser-direct, reuses the key from Settings/news).
// Free tier covers US tickers; non-US (e.g. LSE .L) may return 0 — we keep the
// static value in that case. Throws when no key is set.
import { getNewsKey } from "./news-api";

export interface Quote {
  last: number;
  chg: number; // percent
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const key = getNewsKey();
  if (!key) throw new Error("No Finnhub key");
  const out: Record<string, Quote> = {};
  await Promise.all(
    symbols.map(async (s) => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${key}`);
        if (!res.ok) return;
        const d = await res.json();
        if (d && typeof d.c === "number" && d.c > 0) {
          out[s] = { last: d.c, chg: typeof d.dp === "number" ? d.dp : 0 };
        }
      } catch {
        /* leave static */
      }
    }),
  );
  return out;
}
