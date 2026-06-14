"use client";

import { useEffect, useRef, useState } from "react";
import { ask, hasKey } from "@/lib/browser-ai";
import { portfolioContext } from "@/lib/portfolio-context";

type AgentId = "exec" | "ctx" | "create" | "prio";

const BOXES = {
  step1: { x: 150, y: 14, w: 170, h: 30, t: "Step 1 · Pull first task", ag: false },
  exec: { x: 185, y: 80, w: 110, h: 28, t: "Execution Agent", ag: true, id: "exec" as AgentId },
  step2: { x: 66, y: 142, w: 208, h: 30, t: "Step 2 · Enrich + store", ag: false },
  ctx: { x: 18, y: 208, w: 104, h: 28, t: "Context Agent", ag: true, id: "ctx" as AgentId },
  step3: { x: 150, y: 208, w: 210, h: 30, t: "Step 3 · Create + reprioritize", ag: false },
  create: { x: 148, y: 284, w: 122, h: 28, t: "Task Creation", ag: true, id: "create" as AgentId },
  prio: { x: 300, y: 284, w: 122, h: 28, t: "Prioritization", ag: true, id: "prio" as AgentId },
};

const EXEC: Record<string, string> = {
  risk: "Identified NVDA (~15%) as the top single-stock risk; suggest capping it.",
  diversif: "Holdings span US + UK index funds and stocks; EM exposure would broaden it.",
  concentr: "VUAG is the largest single line; acceptable for an index fund.",
  default: "Reviewed the objective against current holdings and logged findings.",
};
const SPAWN = [
  "Estimate income needed for financial freedom",
  "Compare a dividend ETF vs more index funds",
  "Set a monthly contribution target",
  "Stress-test against a 20% market drop",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const exec = (t: string) => {
  const s = t.toLowerCase();
  for (const k of Object.keys(EXEC)) if (k !== "default" && s.includes(k)) return EXEC[k];
  return EXEC.default;
};

/** Ask Claude to actually perform a task against the portfolio and decide what to do next.
 * Returns a short result plus 0-2 follow-up tasks it spawns itself. */
async function execLive(
  objective: string,
  task: string,
  memory: string[],
): Promise<{ result: string; next: string[] }> {
  const system =
    "You are the Execution agent in an autonomous BabyAGI-style loop managing a personal investment " +
    "research objective. You reason about the user's real portfolio, then output STRICT JSON only: " +
    '{"result": string (one concise sentence of what you found/did), "next": string[] (0-2 short ' +
    "follow-up task titles that move the objective forward, no duplicates of prior work)}. " +
    "Educational only, never financial advice.\n\nPortfolio:\n" +
    portfolioContext() +
    (memory.length ? "\n\nPrior findings:\n- " + memory.join("\n- ") : "");
  const user = `Objective: ${objective}\nCurrent task: ${task}\n\nReturn JSON only.`;
  const raw = await ask(system, user, 320);
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : { result: raw, next: [] };
  return {
    result: String(parsed.result ?? raw).trim(),
    next: Array.isArray(parsed.next) ? parsed.next.map((s: unknown) => String(s)).filter(Boolean).slice(0, 2) : [],
  };
}

export function AutonomousLoop() {
  const [objective, setObjective] = useState("Grow my portfolio toward financial freedom");
  const [queue, setQueue] = useState<string[]>([]);
  const [memory, setMemory] = useState<string[]>([]);
  const [log, setLog] = useState<{ who: string; text: string }[]>([]);
  const [active, setActive] = useState<AgentId | null>(null);
  const [live, setLive] = useState(false);
  const running = useRef(false);

  useEffect(() => setLive(hasKey()), []);

  async function run() {
    if (running.current) return;
    running.current = true;
    const useLive = hasKey();
    let q = ["Find the portfolio's biggest risk", "Improve diversification", "Check for over-concentration"];
    const mem: string[] = [];
    const out: { who: string; text: string }[] = [
      { who: "system", text: "Objective: " + objective + (useLive ? "  ·  engine: live Claude" : "  ·  engine: demo") },
    ];
    setQueue([...q]);
    setMemory([]);
    setLog([...out]);

    const addLog = (who: string, text: string) => {
      out.push({ who, text });
      setLog([...out]);
    };

    for (let i = 0; i < 6 && q.length; i++) {
      const task = q.shift()!;
      setQueue([...q]);
      setActive("exec");
      addLog("Execution", "▶ " + task);
      await sleep(useLive ? 120 : 620);

      let res = "";
      let spawned: string[] = [];
      if (useLive) {
        try {
          const r = await execLive(objective, task, mem);
          res = r.result;
          spawned = r.next;
        } catch (e) {
          res = exec(task) + ` (live fell back: ${e instanceof Error ? e.message.slice(0, 60) : "error"})`;
        }
      } else {
        res = exec(task);
      }
      addLog("Execution", "✓ " + res);
      await sleep(useLive ? 120 : 420);

      setActive("ctx");
      mem.push(res);
      setMemory([...mem]);
      addLog("Context", `stored result · retrieved ${Math.min(mem.length, 2)} related memories`);
      await sleep(useLive ? 160 : 520);

      setActive("create");
      if (!useLive) spawned = Math.random() > 0.25 ? [SPAWN[i % SPAWN.length]] : [];
      if (spawned.length) {
        for (const sp of spawned) {
          q.push(sp);
          addLog("Task Creation", "＋ " + sp);
        }
      } else addLog("Task Creation", "no new task needed");
      setQueue([...q]);
      await sleep(useLive ? 160 : 500);

      setActive("prio");
      // keep the freshest objective-driven tasks first; stable-ish shuffle in demo
      q = useLive ? q : q.sort(() => Math.random() - 0.5);
      addLog("Prioritization", `re-ranked the list (${q.length} left)`);
      setQueue([...q]);
      await sleep(useLive ? 140 : 500);
    }
    setActive(null);
    addLog("system", `Loop paused · ${mem.length} insights stored. (Capped at 6 cycles.)`);
    running.current = false;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass p-5">
        <div className="mb-3 flex items-center gap-2 font-display text-[13px] font-semibold">
          The Loop · watch the agents light up
          <span
            className={
              "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-normal " +
              (live ? "border-emerald text-emerald" : "border-line text-faint")
            }
          >
            <span className={"h-1.5 w-1.5 rounded-full " + (live ? "bg-emerald animate-pulse-dot" : "bg-faint")} />
            {live ? "live Claude" : "demo engine"}
          </span>
        </div>
        <svg viewBox="0 0 460 330" className="h-[320px] w-full" role="img" aria-label="Autonomous agent loop">
          <defs>
            <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0 0L6 3L0 6Z" fill="rgba(255,255,255,.45)" />
            </marker>
          </defs>
          {([
            [235, 44, 235, 80, "execute"],
            [238, 108, 172, 142, "result"],
            [110, 172, 70, 208, "retrieve"],
            [96, 208, 150, 180, "context"],
            [238, 172, 256, 208, "store"],
            [216, 238, 209, 284, "create"],
            [330, 238, 361, 284, "rank"],
          ] as [number, number, number, number, string][]).map(([x1, y1, x2, y2, l], i) => (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.22)" markerEnd="url(#ah)" />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 3} textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 8 }}>
                {l}
              </text>
            </g>
          ))}
          <path d="M360 208 V30 H320" fill="none" stroke="rgba(255,255,255,.22)" markerEnd="url(#ah)" />
          <text x={372} y={120} style={{ fill: "var(--muted)", fontSize: 8 }}>loop</text>
          {Object.values(BOXES).map((b, i) => {
            const isActive = b.ag && active === (b as { id?: AgentId }).id;
            return (
              <g key={i}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={6}
                  fill={b.ag ? "rgba(34,211,238,.14)" : "rgba(255,255,255,.06)"}
                  stroke={isActive ? "#38bdf8" : b.ag ? "#22d3ee" : "var(--line2)"}
                  strokeWidth={isActive ? 2.4 : 1}
                  style={isActive ? { filter: "drop-shadow(0 0 8px #38bdf8)" } : undefined}
                />
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 3} textAnchor="middle" style={{ fill: "var(--ink)", fontSize: 9.5 }}>
                  {b.t}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex gap-2">
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-white/[0.045] px-3 py-2.5 text-[13px] outline-none"
            aria-label="Objective"
          />
          <button onClick={run} className="rounded-xl border border-line2 bg-emerald/[0.16] px-4 font-display font-semibold text-emerald">
            ▶ Run loop
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass p-5">
          <div className="mb-2 font-display text-[13px] font-semibold">Task Queue · {queue.length}</div>
          <div className="min-h-[90px] text-[12.5px]">
            {queue.length ? (
              queue.map((t, i) => (
                <div key={i} className="flex gap-2 border-b border-line py-1.5 last:border-0">
                  <span className="text-[10px] text-faint">{i + 1}</span>
                  {t}
                </div>
              ))
            ) : (
              <span className="text-faint">Queue empty. Hit Run loop.</span>
            )}
          </div>
          <div className="mb-1 mt-3 font-display text-[13px] font-semibold">Memory · Vector DB · {memory.length}</div>
          <div className="min-h-[44px] text-[12px] text-muted">
            {memory.map((m, i) => (
              <div key={i} className="py-0.5">
                <span className="mr-2 text-[10px] text-faint">mem</span>
                {m}
              </div>
            ))}
          </div>
        </div>
        <div className="glass p-5">
          <div className="mb-2 font-display text-[13px] font-semibold">Activity Log</div>
          <div className="max-h-[180px] min-h-[60px] overflow-auto text-[12.5px] text-muted">
            {log.map((e, i) => (
              <div key={i} className="border-b border-line py-1 last:border-0">
                <span className="mr-2 text-[11px] text-faint">{e.who}</span>
                {e.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
