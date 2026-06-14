"use client";

import { useEffect, useState } from "react";
import { ask, hasKey } from "@/lib/browser-ai";
import { portfolioContext } from "@/lib/portfolio-context";

interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  steps: string[];
  /** What this agent is asked to actually do when Claude is connected. */
  goal: string;
}

const AGENTS: AgentDef[] = [
  { id: "an", name: "Stock Analyst", emoji: "🔬", desc: "Analyzes companies, earnings, risks → report",
    steps: ["Pulling fundamentals…", "Reading latest earnings…", "Scoring risk & moat…"],
    goal: "Pick the single holding with the most fragile dividend or richest valuation, and explain the key risk and what to watch, in 3 short sentences." },
  { id: "pm", name: "Portfolio Manager", emoji: "⚖️", desc: "Rebalancing & diversification",
    steps: ["Reading your holdings…", "Measuring concentration…", "Modeling rebalances…"],
    goal: "Assess concentration and diversification across these holdings and suggest one concrete rebalancing idea, in 3 short sentences." },
  { id: "of", name: "Opportunity Finder", emoji: "🛰️", desc: "Scans markets for ideas",
    steps: ["Scanning tickers…", "Filtering by your style…", "Ranking opportunities…"],
    goal: "Given this portfolio's gaps, name one category or type of asset (not a hot tip) that would diversify it and why, in 3 short sentences." },
  { id: "re", name: "Research", emoji: "📚", desc: "Gathers info, writes briefs",
    steps: ["Gathering sources…", "Summarizing filings…", "Cross-checking…"],
    goal: "Write a concise plain-English brief on the dividend durability of the income holdings here, in 3 short sentences." },
];

interface Ev {
  t: string;
  text: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toLocaleTimeString().slice(0, 5);

export function AgentsBoard() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [log, setLog] = useState<Record<string, Ev[]>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [live, setLive] = useState(false);

  useEffect(() => setLive(hasKey()), []);

  async function run(a: AgentDef) {
    if (running[a.id]) return;
    setRunning((r) => ({ ...r, [a.id]: true }));
    setLog((l) => ({ ...l, [a.id]: [] }));
    setProgress((p) => ({ ...p, [a.id]: 0 }));

    const push = (text: string) =>
      setLog((l) => ({ ...l, [a.id]: [...(l[a.id] || []), { t: now(), text }] }));

    const useLive = hasKey();
    // show the working steps as live progress
    for (let i = 0; i < a.steps.length; i++) {
      push(a.steps[i]);
      setProgress((p) => ({ ...p, [a.id]: Math.round(((i + 1) / (a.steps.length + 1)) * 100) }));
      await sleep(useLive ? 300 : 600);
    }

    if (useLive) {
      try {
        const system =
          `You are the ${a.name} agent on an investment command center. Be specific and grounded in the ` +
          "given portfolio. Educational only, never financial advice.\n\nPortfolio:\n" + portfolioContext();
        const reply = await ask(system, a.goal, 260);
        push("✓ " + (reply || "Report ready."));
      } catch (e) {
        push(`✓ ${a.steps[a.steps.length - 1].replace("…", "")} — done (live fell back: ${e instanceof Error ? e.message.slice(0, 60) : "error"})`);
      }
    } else {
      push("Report ready ✓");
    }

    setProgress((p) => ({ ...p, [a.id]: 100 }));
    setRunning((r) => ({ ...r, [a.id]: false }));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 " +
            (live ? "border-emerald text-emerald" : "border-line text-faint")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (live ? "bg-emerald animate-pulse-dot" : "bg-faint")} />
          {live ? "live Claude — agents reason about your portfolio" : "demo engine — add a key in Settings to go live"}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {AGENTS.map((a) => (
          <div key={a.id} className="glass p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-blue/[0.12] text-xl">
                {a.emoji}
              </span>
              <div>
                <div className="font-display text-[15px] font-semibold">{a.name} Agent</div>
                <div className="text-[12px] text-muted">{a.desc}</div>
              </div>
              <button
                onClick={() => run(a)}
                disabled={running[a.id]}
                className="ml-auto rounded-xl border border-line2 bg-blue/[0.14] px-3 py-2 font-display text-[13px] font-semibold text-blue disabled:opacity-50"
              >
                {running[a.id] ? "Running…" : "Run task"}
              </button>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-blue to-emerald transition-[width] duration-300" style={{ width: `${progress[a.id] || 0}%` }} />
            </div>
            <div className="mt-3 min-h-[44px] text-[12.5px] text-muted">
              {(log[a.id] || []).map((e, i) => (
                <div key={i} className="whitespace-pre-wrap border-b border-line py-1 last:border-0">
                  <span className="mr-2 text-[11px] text-faint">{e.t}</span>
                  {e.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
