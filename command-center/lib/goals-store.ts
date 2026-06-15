"use client";

// Editable wealth goals, persisted to localStorage (like holdings).
import { useEffect, useState } from "react";

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  forecast: string; // e.g. "2031"
  unit: "currency" | "score";
}

const KEY = "cc_goals_v1";

export const GOALS_SEED: Goal[] = [
  { id: "g1", title: "$100k portfolio", current: 11725, target: 100000, forecast: "2031", unit: "currency" },
  { id: "g2", title: "Financial freedom", current: 47, target: 100, forecast: "2040", unit: "score" },
  { id: "g3", title: "Dividend income / yr", current: 320, target: 5000, forecast: "2035", unit: "currency" },
  { id: "g4", title: "First rental property", current: 11725, target: 300000, forecast: "2034", unit: "currency" },
];

function read(): Goal[] {
  if (typeof window === "undefined") return GOALS_SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return GOALS_SEED;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : GOALS_SEED;
  } catch {
    return GOALS_SEED;
  }
}
function write(list: Goal[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("cc-goals"));
}

export function upsertGoal(g: Goal) {
  const list = read();
  const i = list.findIndex((x) => x.id === g.id);
  if (i >= 0) list[i] = g; else list.push(g);
  write(list);
}
export function removeGoal(id: string) {
  write(read().filter((x) => x.id !== id));
}
export function resetGoals() {
  write([...GOALS_SEED]);
}

export function useGoals(): Goal[] {
  const [list, setList] = useState<Goal[]>(GOALS_SEED);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("cc-goals", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("cc-goals", sync); window.removeEventListener("storage", sync); };
  }, []);
  return list;
}
