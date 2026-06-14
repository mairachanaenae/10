"use client";

// Approval queue: agents never mutate state directly. They PROPOSE an action;
// the user approves or dismisses it; approval applies the change and records an
// audit entry (reversible where possible).
import { useEffect, useState } from "react";
import { record } from "./audit";
import { setTarget, upsertHolding, removeHolding, getHoldings, type Position } from "./holdings-store";

export type ActionKind = "setTarget" | "addToWatchlist" | "note";

export interface ProposedAction {
  id: string;
  agent: string;
  title: string;
  why: string; // explanation shown to the user
  confidence: number; // 0-1
  kind: ActionKind;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "dismissed";
  ts: number;
}

const KEY = "cc_approvals_v1";

function read(): ProposedAction[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: ProposedAction[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  window.dispatchEvent(new Event("cc-approvals"));
}

export function propose(a: Omit<ProposedAction, "id" | "status" | "ts">): ProposedAction {
  // de-dupe identical pending proposals
  const list = read();
  const dupe = list.find((x) => x.status === "pending" && x.title === a.title && x.agent === a.agent);
  if (dupe) return dupe;
  const action: ProposedAction = { ...a, id: crypto.randomUUID(), status: "pending", ts: Date.now() };
  write([action, ...list]);
  return action;
}

export function approve(id: string) {
  const list = read();
  const a = list.find((x) => x.id === id);
  if (!a || a.status !== "pending") return;
  // apply + audit
  if (a.kind === "setTarget") {
    const sym = a.payload.sym as string;
    const before = getHoldings().find((h) => h.sym === sym)?.target ?? 0;
    setTarget(sym, a.payload.target as number);
    record({ actor: a.agent, action: "Set target allocation", detail: `${sym} ${before}% -> ${a.payload.target}%`, reversible: true });
  } else if (a.kind === "addToWatchlist") {
    const p = a.payload.position as Position;
    upsertHolding(p);
    record({ actor: a.agent, action: "Added position", detail: `${p.sym}`, reversible: true });
  } else {
    record({ actor: a.agent, action: "Noted", detail: a.title, reversible: false });
  }
  write(list.map((x) => (x.id === id ? { ...x, status: "approved" } : x)));
}

export function dismiss(id: string) {
  write(read().map((x) => (x.id === id ? { ...x, status: "dismissed" } : x)));
}

/** Best-effort reverse of an applied action (used by the audit "Undo"). */
export function undoAction(payload: { sym?: string; prevTarget?: number; removeSym?: string }) {
  if (payload.sym && typeof payload.prevTarget === "number") setTarget(payload.sym, payload.prevTarget);
  if (payload.removeSym) removeHolding(payload.removeSym);
}

export function usePendingApprovals(): ProposedAction[] {
  const [list, setList] = useState<ProposedAction[]>([]);
  useEffect(() => {
    const sync = () => setList(read().filter((x) => x.status === "pending"));
    sync();
    window.addEventListener("cc-approvals", sync);
    return () => window.removeEventListener("cc-approvals", sync);
  }, []);
  return list;
}
