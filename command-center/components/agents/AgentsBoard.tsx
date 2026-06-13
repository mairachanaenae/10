"use client";

import { useState } from "react";

interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  steps: string[];
}

const AGENTS: AgentDef[] = [
  { id: "an", name: "Stock Analyst", emoji: "🔬", desc: "Analyzes companies, earnings, risks → report",
    steps: ["Pulling fundamentals…", "Reading latest earnings…", "Scoring risk & moat…", "Report ready ✓"] },
  { id: "pm", name: "Portfolio Manager", emoji: "⚖️", desc: "Rebalancing & diversification",
    steps: ["Reading your holdings…", "Measuring concentration…", "Modeling rebalances…", "Suggestions ready ✓"] },
  { id: "of", name: "Opportunity Finder", emoji: "🛰️", desc: "Scans markets for ideas",
    steps: ["Scanning tickers…", "Filtering by your style…", "Ranking opportunities…", "3 ideas surfaced ✓"] },
  { id: "re", name: "Research", emoji: "📚", desc: "Gathers info, writes briefs",
    steps: ["Gathering sources…", "Summarizing filings…", "Cross-checking…", "Brief compiled ✓"] },
];

interface Ev {
  t: string;
  text: string;
}

export function AgentsBoard() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [log, setLog] = useState<Record<string, Ev[]>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});

  function run(a: AgentDef) {
    if (running[a.id]) return;
    setRunning((r) => ({ ...r, [a.id]: true }));
    setLog((l) => ({ ...l, [a.id]: [] }));
    setProgress((p) => ({ ...p, [a.id]: 0 }));
    let i = 0;
    const t = setInterval(() => {
      const time = new Date().toLocaleTimeString().slice(0, 5);
      setLog((l) => ({ ...l, [a.id]: [...(l[a.id] || []), { t: time, text: a.steps[i] }] }));
      setProgress((p) => ({ ...p, [a.id]: Math.round(((i + 1) / a.steps.length) * 100) }));
      i++;
      if (i >= a.steps.length) {
        clearInterval(t);
        setRunning((r) => ({ ...r, [a.id]: false }));
      }
    }, 650);
  }

  return (
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
              <div key={i} className="border-b border-line py-1 last:border-0">
                <span className="mr-2 text-[11px] text-faint">{e.t}</span>
                {e.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
