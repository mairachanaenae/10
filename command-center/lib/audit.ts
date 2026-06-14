"use client";

// Append-only audit trail in localStorage. Every state change an agent or the
// user makes is recorded here, and reversible entries can be undone.
import { useEffect, useState } from "react";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string; // "user" | agent id
  action: string; // short verb phrase
  detail: string;
  reversible: boolean;
  undoneAt?: number;
}

const KEY = "cc_audit_v1";

function read(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(list: AuditEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  window.dispatchEvent(new Event("cc-audit"));
}

export function record(e: Omit<AuditEntry, "id" | "ts">): AuditEntry {
  const entry: AuditEntry = { ...e, id: crypto.randomUUID(), ts: Date.now() };
  write([entry, ...read()]);
  return entry;
}
export function markUndone(id: string) {
  write(read().map((x) => (x.id === id ? { ...x, undoneAt: Date.now() } : x)));
}
export function listAudit(): AuditEntry[] {
  return read();
}

export function useAudit(): AuditEntry[] {
  const [list, setList] = useState<AuditEntry[]>([]);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("cc-audit", sync);
    return () => window.removeEventListener("cc-audit", sync);
  }, []);
  return list;
}
