"use client";

import { useEffect, useRef, useState } from "react";
import { useHoldings } from "@/lib/holdings-store";
import { computeMetrics, needsRebalance } from "@/lib/analytics";
import { usePendingApprovals } from "@/lib/approvals";

// ── Town map ────────────────────────────────────────────────────────────────
interface Building { id: string; name: string; x: number; y: number; color: string; kind: "civic" | "district" }
const B: Building[] = [
  { id: "townhall", name: "Town Hall", x: 500, y: 90, color: "#9A6B2E", kind: "civic" },
  { id: "bank", name: "Bank", x: 175, y: 150, color: "#3E6B52", kind: "civic" },
  { id: "market", name: "Market Square", x: 825, y: 150, color: "#3E6B52", kind: "civic" },
  { id: "library", name: "Research Library", x: 160, y: 350, color: "#7A5C86", kind: "civic" },
  { id: "workshop", name: "Workshop", x: 500, y: 330, color: "#9A6B2E", kind: "civic" },
  { id: "trading", name: "Trading Post", x: 840, y: 360, color: "#B0463F", kind: "civic" },
  { id: "equity", name: "Equity District", x: 300, y: 520, color: "#3E6B52", kind: "district" },
  { id: "crypto", name: "Crypto Block", x: 520, y: 545, color: "#7A5C86", kind: "district" },
  { id: "real", name: "Real Assets", x: 730, y: 525, color: "#3E6B52", kind: "district" },
];
const byId = (id: string) => B.find((b) => b.id === id)!;
const PURPOSE: Record<string, string> = {
  townhall: "Where every agent reports and you review and approve decisions.",
  bank: "Your cash buffer, balances and safety reserve.",
  market: "Market Square - where the Scout hunts for new opportunities.",
  library: "Research & comparison: opportunities are tagged and weighed here.",
  workshop: "Where the Builder drafts rules, runs backtests and tests scenarios.",
  trading: "The action queue - proposed orders wait here for your approval.",
  equity: "Equity District - your stock-sector exposure.",
  crypto: "Crypto Block - digital-asset exposure.",
  real: "Real Assets - property and real-economy exposure.",
};
const ROADS: [string, string][] = [
  ["townhall", "bank"], ["townhall", "market"], ["townhall", "workshop"],
  ["workshop", "library"], ["workshop", "trading"], ["workshop", "crypto"],
  ["bank", "library"], ["market", "trading"], ["library", "equity"],
  ["trading", "real"], ["equity", "crypto"], ["crypto", "real"],
];

// ── Agents + routes (state machine = ordered waypoints with dwell) ───────────
interface WP { b: string; state: string; dwell: number }
interface Role { id: string; name: string; color: string; route: WP[] }
const ROLES: Role[] = [
  { id: "scout", name: "Scout", color: "#3E6B52", route: [
    { b: "market", state: "scanning Market Square", dwell: 1600 },
    { b: "equity", state: "patrolling Equity District", dwell: 1400 },
    { b: "crypto", state: "discovered a lead", dwell: 1200 },
    { b: "library", state: "tagging for analysis", dwell: 1500 },
    { b: "townhall", state: "reporting findings", dwell: 1600 },
  ] },
  { id: "analyst", name: "Analyst", color: "#3E6B52", route: [
    { b: "townhall", state: "awaiting a lead", dwell: 1400 },
    { b: "market", state: "receiving the opportunity", dwell: 1200 },
    { b: "library", state: "comparing options", dwell: 1800 },
    { b: "workshop", state: "testing scenarios", dwell: 1600 },
    { b: "townhall", state: "delivering a recommendation", dwell: 1500 },
  ] },
  { id: "builder", name: "Builder", color: "#9A6B2E", route: [
    { b: "townhall", state: "taking the recommendation", dwell: 1300 },
    { b: "workshop", state: "drafting rules & lists", dwell: 1800 },
    { b: "workshop", state: "backtesting", dwell: 1400 },
    { b: "trading", state: "queueing for approval", dwell: 1700 },
  ] },
  { id: "steward", name: "Steward", color: "#B0463F", route: [
    { b: "bank", state: "checking cash buffer", dwell: 1500 },
    { b: "workshop", state: "auditing rules", dwell: 1300 },
    { b: "equity", state: "checking sector risk", dwell: 1400 },
    { b: "townhall", state: "raising a flag", dwell: 1700 },
  ] },
  { id: "messenger", name: "Messenger", color: "#5C5750", route: [
    { b: "bank", state: "gathering balances", dwell: 1200 },
    { b: "trading", state: "gathering orders", dwell: 1200 },
    { b: "workshop", state: "gathering rules", dwell: 1200 },
    { b: "townhall", state: "reporting in plain language", dwell: 1800 },
  ] },
];

// adjacency graph from the roads, so agents walk the network (not straight lines)
const ADJ: Record<string, string[]> = {};
for (const [a, b] of ROADS) { (ADJ[a] ||= []).push(b); (ADJ[b] ||= []).push(a); }
function bfs(start: string, goal: string): string[] {
  if (start === goal) return [goal];
  const prev: Record<string, string | null> = { [start]: null };
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    for (const n of ADJ[c] || []) {
      if (n in prev) continue;
      prev[n] = c;
      if (n === goal) {
        const path: string[] = []; let cur: string | null = goal;
        while (cur != null) { path.unshift(cur); cur = prev[cur]; }
        return path;
      }
      q.push(n);
    }
  }
  return [start, goal];
}

interface RT { x: number; y: number; at: string; wp: number; path: string[]; pi: number; dwellUntil: number; moving: boolean }
const SPEED = 2.4; // px per frame
const ARRIVE = 5;

export function Town() {
  const holdings = useHoldings();
  const pending = usePendingApprovals();
  const metrics = computeMetrics(holdings);
  const drift = needsRebalance(metrics, 5);

  const [selected, setSelected] = useState<string | null>(null);
  const rt = useRef<Record<string, RT>>(
    Object.fromEntries(ROLES.map((r) => {
      const start = byId(r.route[0].b);
      return [r.id, { x: start.x, y: start.y, at: r.route[0].b, wp: 0, path: [r.route[0].b], pi: 0, dwellUntil: 0, moving: false }];
    })),
  );
  const [, force] = useState(0);

  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      for (const r of ROLES) {
        const a = rt.current[r.id];
        const target = r.route[a.wp].b;
        if (a.at === target) {
          const c = byId(target); a.x = c.x; a.y = c.y; a.moving = false;
          if (!a.dwellUntil) a.dwellUntil = ts + (reduce ? 400 : r.route[a.wp].dwell);
          else if (ts >= a.dwellUntil) {
            a.dwellUntil = 0;
            a.wp = (a.wp + 1) % r.route.length;
            a.path = bfs(a.at, r.route[a.wp].b); a.pi = 0;
          }
        } else {
          if (a.path.length < 2 || a.path[a.path.length - 1] !== target) { a.path = bfs(a.at, target); a.pi = 0; }
          const node = byId(a.path[Math.min(a.pi + 1, a.path.length - 1)]);
          const dx = node.x - a.x, dy = node.y - a.y, dist = Math.hypot(dx, dy);
          a.moving = true;
          if (dist > ARRIVE) { const sp = Math.min(dist, reduce ? dist : SPEED); a.x += (dx / dist) * sp; a.y += (dy / dist) * sp; }
          else { a.x = node.x; a.y = node.y; a.at = node.id; a.pi = Math.min(a.pi + 1, a.path.length - 1); }
        }
      }
      force((n) => (n + 1) % 1000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stateOf = (r: Role): string => {
    const a = rt.current[r.id];
    const wp = r.route[a.wp];
    if (a.moving) return `walking to ${byId(wp.b).name}`;
    if (r.id === "steward" && wp.b === "townhall") return drift ? "flagging allocation drift" : "all clear, no flags";
    if (r.id === "messenger" && wp.b === "townhall") return `reporting · ${pending.length} pending approval${pending.length === 1 ? "" : "s"}`;
    return wp.state;
  };

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div><span className="iv-eyebrow">Investment Town</span>
          <div className="iv-display" style={{ fontSize: 40, marginTop: 6 }}>The Town</div>
          <div className="iv-hero-sub" style={{ marginTop: 8 }}>
            <span style={{ color: "var(--mute)", fontSize: 13 }}>Each agent moves as its task changes. A living view of your decision system.</span>
          </div>
          <div className="iv-rule" /></div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="iv-panel" style={{ padding: 14 }}>
          <svg viewBox="0 0 1000 620" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Investment town map">
            <defs>
              <radialGradient id="ground" cx="50%" cy="38%" r="78%">
                <stop offset="0%" stopColor="#FAF7EF" /><stop offset="100%" stopColor="#EBE5D7" />
              </radialGradient>
              <filter id="softsh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#272320" floodOpacity="0.16" /></filter>
            </defs>
            <rect x="1" y="1" width="998" height="618" rx="16" fill="url(#ground)" stroke="rgba(39,35,32,.1)" />
            {/* roads: a warm path network */}
            {ROADS.map(([a, b], i) => {
              const p = byId(a), q = byId(b);
              return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(39,35,32,.1)" strokeWidth={5} strokeLinecap="round" />;
            })}
            {/* agent route-trails (where each is heading) */}
            {ROLES.map((r) => {
              const a = rt.current[r.id];
              if (!a.moving) return null;
              const rest = a.path.slice(a.pi + 1).map((id) => byId(id));
              const pts = [`${a.x},${a.y}`, ...rest.map((n) => `${n.x},${n.y}`)].join(" ");
              return <polyline key={"trail" + r.id} points={pts} fill="none" stroke={r.color} strokeWidth={2} strokeOpacity={0.28} strokeDasharray="1 7" strokeLinecap="round" />;
            })}
            {B.map((b) => {
              const on = selected === b.id;
              const c = on ? "#9A6B2E" : b.color;
              return (
                <g key={b.id} style={{ cursor: "pointer" }} onClick={() => setSelected(on ? null : b.id)}>
                  <ellipse cx={b.x} cy={b.y + 25} rx={32} ry={7} fill="rgba(39,35,32,.12)" />
                  <g filter="url(#softsh)">
                    {/* body */}
                    <rect x={b.x - 30} y={b.y - 14} width={60} height={36} rx={9}
                      fill={on ? "rgba(154,107,46,.14)" : b.kind === "district" ? "#FCFAF4" : "#FFFFFF"}
                      stroke={c} strokeWidth={on ? 2.2 : 1.4} />
                    {/* roof accent */}
                    <path d={`M ${b.x - 30} ${b.y - 12} Q ${b.x} ${b.y - 30} ${b.x + 30} ${b.y - 12}`} fill="none" stroke={c} strokeWidth={on ? 2.4 : 1.8} strokeLinecap="round" />
                  </g>
                  <circle cx={b.x} cy={b.y + 4} r={3.5} fill={c} />
                  <text x={b.x} y={b.y + 42} textAnchor="middle" fontFamily="'Newsreader',serif" fontStyle="italic" fontSize="12.5" fill={on ? "#9A6B2E" : "#6B6358"}>{b.name}</text>
                </g>
              );
            })}
            {ROLES.map((r) => {
              const a = rt.current[r.id];
              return (
                <g key={r.id}>
                  <ellipse cx={a.x} cy={a.y + 11} rx={10} ry={3.2} fill="rgba(39,35,32,.18)" />
                  {!a.moving && (
                    <circle cx={a.x} cy={a.y} r={9} fill="none" stroke={r.color} strokeWidth={1.6} opacity={0.6}>
                      <animate attributeName="r" values="9;17;9" dur="2.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.55;0;0.55" dur="2.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={a.x} cy={a.y} r={8.5} fill={r.color} stroke="#FBF9F3" strokeWidth={2} filter="url(#softsh)" />
                  <text x={a.x} y={a.y - 14} textAnchor="middle" fontFamily="'Newsreader',serif" fontWeight={500} fontSize="12.5" fill={r.color}>{r.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="iv-panel">
          {selected ? (() => {
            const b = byId(selected);
            const here = ROLES.filter((r) => !rt.current[r.id].moving && rt.current[r.id].at === selected);
            const links = ADJ[selected] || [];
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: b.color, flex: "none" }} />
                  <span className="iv-display" style={{ fontSize: 19 }}>{b.name}</span>
                  <button className="iv-chip" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={() => setSelected(null)}>Back</button>
                </div>
                <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 10 }}>{PURPOSE[selected]}</p>
                <div className="iv-eyebrow" style={{ marginTop: 16 }}>Here now</div>
                {here.length ? here.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flex: "none" }} />
                    <span style={{ fontSize: 13 }}>{r.name}</span><span style={{ fontSize: 12, color: "var(--mute)" }}>· {stateOf(r)}</span>
                  </div>
                )) : <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 6 }}>No agent here right now.</div>}
                <div className="iv-eyebrow" style={{ marginTop: 16 }}>Connected to</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {links.map((l) => <button key={l} className="iv-chip" style={{ padding: "4px 10px" }} onClick={() => setSelected(l)}>{byId(l).name}</button>)}
                </div>
              </div>
            );
          })() : (
            <>
              <span className="iv-eyebrow">Agents</span>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {ROLES.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--line2)", paddingTop: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flex: "none" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontFamily: "'Space Mono', monospace", letterSpacing: ".02em" }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: "var(--mute)" }}>{stateOf(r)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="iv-foot" style={{ marginTop: 16 }}>Tap a building to inspect it. Steward and Messenger react to your real data (drift flags and pending approvals); the rest patrol their routes.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
