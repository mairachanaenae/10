"use client";

// Single source of truth for the user's positions + target allocation.
// Persists to localStorage (swap to Supabase later). Seeded with the real book.
import { useEffect, useState } from "react";

export interface Position {
  sym: string;
  name: string;
  sh: number;
  px: number; // last known / manual price (live quotes override at display time)
  cost?: number; // average cost basis per share
  chg?: number; // day % (sample; live quotes override)
  tone: string;
  quoteSym?: string; // Finnhub symbol if it differs (e.g. VUAG.L)
  target?: number; // target allocation %, 0-100
}

const KEY = "cc_holdings_v1";

export const SEED: Position[] = [
  { sym: "VUAG", name: "Vanguard S&P 500 UCITS", sh: 12, px: 266.67, cost: 232.0, chg: 1.30, tone: "#3E6B52", quoteSym: "VUAG.L", target: 40 },
  { sym: "JNJ", name: "Johnson & Johnson", sh: 14, px: 172.14, cost: 158.0, chg: 0.75, tone: "#5C7A8A", target: 15 },
  { sym: "KO", name: "Coca-Cola", sh: 22, px: 82.50, cost: 70.0, chg: 1.25, tone: "#9A6B2E", target: 15 },
  { sym: "NVDA", name: "NVIDIA", sh: 9, px: 180.00, cost: 95.0, chg: 1.95, tone: "#7A5C86", target: 20 },
  { sym: "O", name: "Realty Income", sh: 20, px: 59.00, cost: 62.0, chg: -0.50, tone: "#B0463F", target: 10 },
];

function read(): Position[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function write(list: Position[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("cc-holdings"));
}

export function getHoldings(): Position[] {
  return read();
}
export function upsertHolding(p: Position) {
  const list = read();
  const i = list.findIndex((x) => x.sym === p.sym);
  if (i >= 0) list[i] = { ...list[i], ...p };
  else list.push(p);
  write(list);
}
export function removeHolding(sym: string) {
  write(read().filter((x) => x.sym !== sym));
}
export function setTarget(sym: string, target: number) {
  const list = read().map((x) => (x.sym === sym ? { ...x, target } : x));
  write(list);
}
export function resetHoldings() {
  write([...SEED]);
}

/** React hook that re-reads on any in-tab or cross-tab change. */
export function useHoldings(): Position[] {
  const [list, setList] = useState<Position[]>(SEED);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("cc-holdings", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cc-holdings", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
