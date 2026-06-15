// Browser-direct news fetching via Finnhub (CORS-friendly, token in query string).
// The key lives only in the user's browser localStorage. For a shared/secure deploy,
// use the server route at app/api/news/route.ts (reads FINNHUB_API_KEY server-side).
import type { NewsItem, NewsTone } from "./news";

const KEY = "cc_finnhub_key";

export function getNewsKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
export function setNewsKey(k: string) {
  localStorage.setItem(KEY, k.trim());
}
export function clearNewsKey() {
  localStorage.removeItem(KEY);
}
export function hasNewsKey(): boolean {
  return Boolean(getNewsKey());
}

interface FinnhubArticle {
  category?: string;
  datetime?: number;
  headline?: string;
  source?: string;
  summary?: string;
  url?: string;
  related?: string;
  image?: string;
}

const BULL = /(beat|surge|jump|soar|record|rally|upgrade|growth|profit|gain|rise|strong|raises)/i;
const BEAR = /(miss|fall|drop|plunge|cut|downgrade|loss|lawsuit|probe|warn|weak|decline|slump|slash)/i;

function toneOf(text: string): NewsTone {
  if (BEAR.test(text)) return "bear";
  if (BULL.test(text)) return "bull";
  return "neutral";
}

function ago(unixSec?: number): string {
  if (!unixSec) return "recent";
  const mins = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function mapArticles(raw: FinnhubArticle[], symbol: string): NewsItem[] {
  return raw
    .filter((a) => a.headline)
    .slice(0, 12)
    .map((a, i) => {
      const blob = `${a.headline} ${a.summary ?? ""}`;
      return {
        id: `live-${symbol}-${i}-${a.datetime ?? i}`,
        symbol: symbol === "All" ? "MKT" : symbol,
        source: a.source ?? "Newswire",
        time: ago(a.datetime),
        headline: a.headline!,
        summary: (a.summary ?? "").slice(0, 220) || "Tap for the full story.",
        tone: toneOf(blob),
        tags: [a.category || (symbol === "All" ? "Market" : symbol)],
        url: a.url,
        image: a.image && a.image.startsWith("http") ? a.image : undefined,
      };
    });
}

/** Fetch live headlines for a symbol ("All"/"MKT" → general market). Throws on failure. */
export async function fetchNews(symbol: string): Promise<NewsItem[]> {
  const key = getNewsKey();
  if (!key) throw new Error("No Finnhub key set");
  const market = symbol === "All" || symbol === "MKT";
  const url = market
    ? `https://finnhub.io/api/v1/news?category=general&token=${key}`
    : `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate()}&to=${toDate()}&token=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const data = (await res.json()) as FinnhubArticle[];
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return mapArticles(data, symbol);
}

function toDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function fromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().slice(0, 10);
}

/** Verify a key works. Returns null on success, else an error string. */
export async function verifyNewsKey(): Promise<string | null> {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${getNewsKey()}`);
    if (!res.ok) return `Finnhub ${res.status}`;
    const data = await res.json();
    if (!Array.isArray(data)) return "Unexpected response (check the key)";
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "failed";
  }
}
