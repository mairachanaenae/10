"use client";

// A simple watchlist of tickers, persisted to localStorage.
import { useEffect, useState } from "react";

export interface WatchItem { sym: string; name?: string }

const KEY = "cc_watchlist_v1";

export const WATCH_SEED: WatchItem[] = [
  { sym: "AAPL", name: "Apple" },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "AMD", name: "Advanced Micro Devices" },
  { sym: "ASML", name: "ASML Holding" },
  { sym: "AMZN", name: "Amazon" },
];

function read(): WatchItem[] {
  if (typeof window === "undefined") return WATCH_SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return WATCH_SEED;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : WATCH_SEED;
  } catch {
    return WATCH_SEED;
  }
}
function write(list: WatchItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("cc-watchlist"));
}
export function addWatch(sym: string) {
  const s = sym.trim().toUpperCase();
  if (!s) return;
  const list = read();
  if (list.some((x) => x.sym === s)) return;
  write([...list, { sym: s }]);
}
export function removeWatch(sym: string) {
  write(read().filter((x) => x.sym !== sym));
}
export function useWatchlist(): WatchItem[] {
  const [list, setList] = useState<WatchItem[]>(WATCH_SEED);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("cc-watchlist", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("cc-watchlist", sync); window.removeEventListener("storage", sync); };
  }, []);
  return list;
}
