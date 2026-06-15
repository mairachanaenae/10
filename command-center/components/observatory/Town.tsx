"use client";

import { useEffect, useRef, useState } from "react";
import { useHoldings } from "@/lib/holdings-store";
import { computeMetrics, needsRebalance } from "@/lib/analytics";
import { usePendingApprovals } from "@/lib/approvals";

// ── Town map ────────────────────────────────────────────────────────────────
interface Building { id: string; name: string; x: number; y: number; color: string; kind: "civic" | "district" }
const B: Building[] = [
  { id: "townhall", name: "Town Hall", x: 500, y: 90, color: "#F4B23E", kind: "civic" },
  { id: "bank", name: "Bank", x: 175, y: 150, color: "#37E6FF", kind: "civic" },
  { id: "market", name: "Market Square", x: 825, y: 150, color: "#43E6A0", kind: "civic" },
  { id: "library", name: "Research Library", x: 160, y: 350, color: "#9C8BFF", kind: "civic" },
  { id: "workshop", name: "Workshop", x: 500, y: 330, color: "#F4B23E", kind: "civic" },
  { id: "trading", name: "Trading Post", x: 840, y: 360, color: "#FF5C7A", kind: "civic" },
  { id: "equity", name: "Equity District", x: 300, y: 520, color: "#37E6FF", kind: "district" },
  { id: "crypto", name: "Crypto Block", x: 520, y: 545, color: "#E26DF0", kind: "district" },
  { id: "real", name: "Real Assets", x: 730, y: 525, color: "#43E6A0", kind: "district" },
];
const byId = (id: string) => B.find((b) => b.id === id)!;
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
  { id: "scout", name: "Scout", color: "#37E6FF", route: [
    { b: "market", state: "scanning Market Square", dwell: 1600 },
    { b: "equity", state: "patrolling Equity District", dwell: 1400 },
    { b: "crypto", state: "discovered a lead", dwell: 1200 },
    { b: "library", state: "tagging for analysis", dwell: 1500 },
    { b: "townhall", state: "reporting findings", dwell: 1600 },
  ] },
  { id: "analyst", name: "Analyst", color: "#43E6A0", route: [
    { b: "townhall", state: "awaiting a lead", dwell: 1400 },
    { b: "market", state: "receiving the opportunity", dwell: 1200 },
    { b: "library", state: "comparing options", dwell: 1800 },
    { b: "workshop", state: "testing scenarios", dwell: 1600 },
    { b: "townhall", state: "delivering a recommendation", dwell: 1500 },
  ] },
  { id: "builder", name: "Builder", color: "#F4B23E", route: [
    { b: "townhall", state: "taking the recommendation", dwell: 1300 },
    { b: "workshop", state: "drafting rules & lists", dwell: 1800 },
    { b: "workshop", state: "backtesting", dwell: 1400 },
    { b: "trading", state: "queueing for approval", dwell: 1700 },
  ] },
  { id: "steward", name: "Steward", color: "#FF5C7A", route: [
    { b: "bank", state: "checking cash buffer", dwell: 1500 },
    { b: "workshop", state: "auditing rules", dwell: 1300 },
    { b: "equity", state: "checking sector risk", dwell: 1400 },
    { b: "townhall", state: "raising a flag", dwell: 1700 },
  ] },
  { id: "messenger", name: "Messenger", color: "#E8F0FF", route: [
    { b: "bank", state: "gathering balances", dwell: 1200 },
    { b: "trading", state: "gathering orders", dwell: 1200 },
    { b: "workshop", state: "gathering rules", dwell: 1200 },
    { b: "townhall", state: "reporting in plain language", dwell: 1800 },
  ] },
];

interface RT { x: number; y: number; wp: number; dwellUntil: number; moving: boolean }
const SPEED = 2.1; // px per frame
const ARRIVE = 4;

export function Town() {
  const holdings = useHoldings();
  const pending = usePendingApprovals();
  const metrics = computeMetrics(holdings);
  const drift = needsRebalance(metrics, 5);

  const rt = useRef<Record<string, RT>>(
    Object.fromEntries(ROLES.map((r) => {
      const start = byId(r.route[0].b);
      return [r.id, { x: start.x, y: start.y, wp: 0, dwellUntil: 0, moving: false }];
    })),
  );
  const [, force] = useState(0);

  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      for (const r of ROLES) {
        const a = rt.current[r.id];
        const wp = r.route[a.wp];
        const t = byId(wp.b);
        const dx = t.x - a.x, dy = t.y - a.y, dist = Math.hypot(dx, dy);
        if (dist > ARRIVE) {
          a.moving = true;
          const sp = Math.min(dist, reduce ? dist : SPEED); // ease into target
          a.x += (dx / dist) * sp; a.y += (dy / dist) * sp;
        } else {
          a.x = t.x; a.y = t.y; a.moving = false;
          if (!a.dwellUntil) a.dwellUntil = ts + (reduce ? 400 : wp.dwell);
          else if (ts >= a.dwellUntil) { a.dwellUntil = 0; a.wp = (a.wp + 1) % r.route.length; }
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
          <div className="iv-display" style={{ fontSize: 34, marginTop: 6 }}>The Town</div>
          <div className="iv-hero-sub" style={{ marginTop: 8 }}>
            <span style={{ color: "var(--mute)", fontSize: 13 }}>Each agent moves as its task changes. A living view of your decision system.</span>
          </div>
          <div className="iv-rule" /></div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="iv-panel" style={{ padding: 14 }}>
          <svg viewBox="0 0 1000 620" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Investment town map">
            <defs>
              <radialGradient id="ground" cx="50%" cy="40%" r="75%">
                <stop offset="0%" stopColor="#0c1330" /><stop offset="100%" stopColor="#05070e" />
              </radialGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect x="0" y="0" width="1000" height="620" rx="14" fill="url(#ground)" />
            {ROADS.map(([a, b], i) => {
              const p = byId(a), q = byId(b);
              return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(120,200,255,.14)" strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />;
            })}
            {B.map((b) => (
              <g key={b.id}>
                <ellipse cx={b.x} cy={b.y + 26} rx={34} ry={8} fill="rgba(0,0,0,.45)" />
                <rect x={b.x - 30} y={b.y - 22} width={60} height={44} rx={11}
                  fill={b.kind === "district" ? "rgba(120,170,255,.06)" : "rgba(120,170,255,.1)"}
                  stroke={b.color} strokeWidth={1.4} opacity={0.95} filter="url(#glow)" />
                <circle cx={b.x} cy={b.y - 2} r={4} fill={b.color} />
                <text x={b.x} y={b.y + 40} textAnchor="middle" fontFamily="Orbitron, sans-serif" fontSize="11" letterSpacing="1" fill="#aebbd6">{b.name}</text>
              </g>
            ))}
            {ROLES.map((r) => {
              const a = rt.current[r.id];
              return (
                <g key={r.id}>
                  <ellipse cx={a.x} cy={a.y + 11} rx={11} ry={3.4} fill="rgba(0,0,0,.5)" />
                  <circle cx={a.x} cy={a.y} r={9} fill={r.color} filter="url(#glow)" />
                  <circle cx={a.x} cy={a.y} r={9} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1} />
                  <text x={a.x} y={a.y - 14} textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontWeight={600} fontSize="12" fill={r.color}>{r.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="iv-panel">
          <span className="iv-eyebrow">Agents</span>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {ROLES.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--line2)", paddingTop: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, boxShadow: `0 0 10px ${r.color}`, flex: "none" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontFamily: "Rajdhani, sans-serif", letterSpacing: ".02em" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--mute)" }}>{stateOf(r)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="iv-foot" style={{ marginTop: 16 }}>Steward and Messenger react to your real data — drift flags and pending approvals. The rest patrol their routes. Modular: add buildings or roles in <span className="iv-mono">Town.tsx</span>.</p>
        </div>
      </div>
    </div>
  );
}
