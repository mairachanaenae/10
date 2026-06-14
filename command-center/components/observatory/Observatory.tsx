"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Wallet, Radar, Activity, Landmark, Search, Bell, Plus, Minus, Clock, Circle,
  ArrowUpRight, ArrowDownRight, Sparkles, KeyRound, Send,
} from "lucide-react";
import { MENTORS } from "@/lib/mentors";
import { chat, hasKey, setApiKey, type Msg as AiMsg } from "@/lib/browser-ai";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

.iv-root *{box-sizing:border-box;margin:0;padding:0}
.iv-root{
  --ink:#0A0E14; --abyss:#070A0F; --paper:#ECEAE3; --mute:#8A93A3;
  --frost:rgba(255,255,255,.05); --frost2:rgba(255,255,255,.08);
  --line:rgba(255,255,255,.10); --line2:rgba(255,255,255,.06);
  --up:#5BE0B0; --down:#FF6B7A; --brass:#D9B26A;
  position:fixed; inset:0; overflow:hidden;
  background:var(--ink); color:var(--paper);
  font-family:'Inter',system-ui,sans-serif; font-size:14px; line-height:1.45;
  -webkit-font-smoothing:antialiased;
}
.iv-aurora{position:absolute; inset:-20%; z-index:0; pointer-events:none; filter:blur(40px);
  background:
    radial-gradient(40% 50% at 18% 22%, rgba(109,90,224,.20), transparent 70%),
    radial-gradient(45% 45% at 82% 30%, rgba(43,184,196,.16), transparent 70%),
    radial-gradient(50% 50% at 60% 95%, rgba(217,178,106,.10), transparent 70%);
  animation:drift 26s ease-in-out infinite alternate;
}
@keyframes drift{ from{transform:translate3d(-2%,-1%,0) scale(1)} to{transform:translate3d(3%,2%,0) scale(1.08)} }

.iv-display{font-family:'Fraunces',Georgia,serif; font-optical-sizing:auto; letter-spacing:-.01em}
.iv-mono{font-family:'JetBrains Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums}
.iv-eyebrow{font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--mute); font-weight:600}
.up{color:var(--up)} .down{color:var(--down)} .brass{color:var(--brass)}

.iv-shell{position:relative; z-index:1; display:grid; grid-template-columns:84px 1fr; height:100%}
.iv-rail{display:flex; flex-direction:column; align-items:center; gap:6px; padding:22px 0;
  border-right:1px solid var(--line2); background:rgba(7,10,15,.45); backdrop-filter:blur(14px)}
.iv-mark{width:34px; height:34px; border-radius:11px; margin-bottom:20px;
  background:linear-gradient(140deg,var(--brass),#8a6e3a); display:grid; place-items:center;
  font-family:'Fraunces',serif; font-weight:600; color:#0A0E14; font-size:18px;
  box-shadow:0 6px 18px rgba(217,178,106,.30)}
.iv-navbtn{position:relative; width:52px; height:52px; border:0; background:transparent; cursor:pointer;
  border-radius:14px; color:var(--mute); display:grid; place-items:center; transition:.18s}
.iv-navbtn:hover{color:var(--paper); background:var(--frost)}
.iv-navbtn.on{color:var(--paper); background:var(--frost2)}
.iv-navbtn.on::before{content:""; position:absolute; left:-2px; top:14px; bottom:14px; width:3px;
  border-radius:3px; background:var(--brass); box-shadow:0 0 12px rgba(217,178,106,.7)}
.iv-navlbl{font-size:9.5px; letter-spacing:.08em; margin-top:2px}

.iv-main{overflow-y:auto; overflow-x:hidden; padding:0}
.iv-topbar{position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:16px;
  padding:18px 30px; border-bottom:1px solid var(--line2);
  background:rgba(10,14,20,.72); backdrop-filter:blur(18px)}
.iv-srch{flex:1; max-width:420px; display:flex; align-items:center; gap:10px; padding:10px 14px;
  background:var(--frost); border:1px solid var(--line); border-radius:12px; color:var(--mute)}
.iv-srch input{background:transparent; border:0; outline:0; color:var(--paper); width:100%; font-size:13.5px}
.iv-srch input::placeholder{color:var(--mute)}
.iv-pill{display:flex; align-items:center; gap:7px; padding:8px 13px; border-radius:11px;
  border:1px solid var(--line); background:var(--frost); font-size:13px}
.iv-icon-btn{width:40px; height:40px; border-radius:11px; border:1px solid var(--line);
  background:var(--frost); color:var(--mute); display:grid; place-items:center; cursor:pointer}
.iv-icon-btn:hover{color:var(--paper)}
.dot-live{width:7px;height:7px;border-radius:50%;background:var(--up);box-shadow:0 0 9px var(--up)}

.iv-page{padding:30px; max-width:1320px; margin:0 auto}
.iv-pagehead{display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:22px; flex-wrap:wrap}

.iv-panel{background:var(--frost); border:1px solid var(--line); border-radius:20px; padding:24px;
  box-shadow:0 18px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.10);
  backdrop-filter:blur(20px) saturate(135%)}
.iv-grid{display:grid; gap:18px}

.iv-hero-num{font-size:clamp(40px,6vw,68px); font-weight:400; line-height:1; margin:10px 0 6px}
.iv-hero-sub{display:flex; align-items:center; gap:10px; color:var(--mute); font-size:14px; flex-wrap:wrap}
.iv-rule{height:2px; width:64px; margin-top:16px; border-radius:2px;
  background:linear-gradient(90deg,var(--brass),transparent); transition:width .9s ease}

.iv-tabs{display:inline-flex; gap:2px; padding:3px; border-radius:11px; background:var(--frost); border:1px solid var(--line)}
.iv-tab{border:0; background:transparent; color:var(--mute); padding:6px 13px; border-radius:8px;
  cursor:pointer; font-size:12.5px; font-weight:500; font-family:'JetBrains Mono',monospace}
.iv-tab.on{background:var(--frost2); color:var(--paper)}

.iv-tbl{width:100%; border-collapse:collapse}
.iv-tbl th{text-align:right; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--mute); font-weight:600; padding:0 0 14px; cursor:pointer; user-select:none}
.iv-tbl th:first-child,.iv-tbl td:first-child{text-align:left}
.iv-tbl td{padding:14px 0; border-top:1px solid var(--line2); font-size:14px}
.iv-tbl tr:hover td{background:rgba(255,255,255,.02)}
.iv-sym{display:flex; align-items:center; gap:12px}
.iv-badge{width:36px; height:36px; border-radius:10px; display:grid; place-items:center;
  font-family:'Fraunces',serif; font-weight:600; font-size:15px; flex:none}
.iv-symname{font-size:12px; color:var(--mute)}

.iv-chip{border:1px solid var(--line); background:var(--frost); color:var(--mute);
  padding:7px 14px; border-radius:999px; cursor:pointer; font-size:12.5px; font-weight:500}
.iv-chip.on{background:var(--brass); border-color:var(--brass); color:#0A0E14; font-weight:600}

.iv-mover{flex:none; min-width:150px; padding:14px 16px; border-radius:14px;
  background:var(--frost); border:1px solid var(--line)}

.iv-seg{display:flex; padding:3px; border-radius:12px; background:var(--frost); border:1px solid var(--line)}
.iv-seg button{flex:1; border:0; background:transparent; color:var(--mute); padding:10px;
  border-radius:9px; cursor:pointer; font-weight:600; font-size:13px}
.iv-seg button.buy{background:var(--up); color:#04130d}
.iv-seg button.sell{background:var(--down); color:#1a0508}
.iv-field{display:flex; flex-direction:column; gap:7px; margin-top:16px}
.iv-field label{font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--mute)}
.iv-input{display:flex; align-items:center; gap:8px; padding:11px 13px; border-radius:11px;
  background:var(--abyss); border:1px solid var(--line)}
.iv-input input{flex:1; background:transparent; border:0; outline:0; color:var(--paper);
  font-family:'JetBrains Mono',monospace; font-size:16px}
.iv-stepper{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--frost);
  color:var(--paper);cursor:pointer;display:grid;place-items:center}
.iv-cta{width:100%; margin-top:20px; padding:14px; border:0; border-radius:12px; cursor:pointer;
  font-weight:600; font-size:14px; letter-spacing:.02em}
.iv-cta.buy{background:var(--up); color:#04130d} .iv-cta.sell{background:var(--down); color:#1a0508}
.iv-cta.brassbtn{background:var(--brass); color:#0A0E14}
input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:4px;background:var(--line);outline:0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;
  background:var(--brass);cursor:pointer;box-shadow:0 0 0 4px rgba(217,178,106,.18)}

.iv-book-row{position:relative; display:flex; justify-content:space-between; padding:5px 10px;
  font-family:'JetBrains Mono',monospace; font-size:12.5px; border-radius:6px}
.iv-depth{position:absolute; top:0; bottom:0; right:0; border-radius:6px; z-index:0}
.iv-book-row span{position:relative; z-index:1}
.iv-spread{display:flex; justify-content:space-between; padding:9px 10px; margin:4px 0;
  border-top:1px solid var(--line2); border-bottom:1px solid var(--line2);
  font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--mute)}

.iv-fnrow{display:grid; grid-template-columns:160px 1fr auto; gap:14px; align-items:center; padding:9px 0}
.iv-track{height:9px; border-radius:6px; background:var(--line2); overflow:hidden}
.iv-fill{height:100%; border-radius:6px; background:linear-gradient(90deg,var(--brass),#8a6e3a)}
.iv-tag{display:inline-flex; align-items:center; gap:6px; font-size:10.5px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--brass); border:1px solid rgba(217,178,106,.4);
  padding:4px 9px; border-radius:999px}
.iv-foot{font-size:11.5px; color:var(--mute); margin-top:20px; line-height:1.6}
.iv-foot a{color:var(--brass); text-decoration:none}

.iv-stat{padding:18px 20px; border-radius:16px; background:var(--frost); border:1px solid var(--line)}
.iv-stat .k{font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--mute)}
.iv-stat .v{font-family:'Fraunces',serif; font-size:26px; margin-top:6px}

.iv-tip{background:rgba(7,10,15,.92); border:1px solid var(--line); border-radius:11px; padding:10px 13px;
  backdrop-filter:blur(8px)}
.iv-tip .tt{font-size:11px; color:var(--mute)} .iv-tip .tv{font-family:'JetBrains Mono',monospace; font-size:14px; margin-top:3px}

/* advisor */
.iv-mentor{display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer;
  padding:12px 14px; border-radius:14px; border:1px solid var(--line); background:var(--frost); color:var(--paper); transition:.15s}
.iv-mentor:hover{background:var(--frost2)}
.iv-mentor.on{border-color:var(--brass); background:rgba(217,178,106,.12)}
.iv-mentor .mi{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none;
  background:rgba(217,178,106,.14); color:var(--brass)}
.iv-chatbox{display:flex; flex-direction:column; gap:10px; height:340px; overflow:auto; padding-right:4px}
.iv-bub{max-width:84%; padding:10px 13px; border-radius:14px; font-size:13.5px; line-height:1.5; white-space:pre-wrap}
.iv-bub.me{align-self:flex-end; background:rgba(217,178,106,.16); border:1px solid rgba(217,178,106,.3)}
.iv-bub.ai{align-self:flex-start; background:var(--frost); border:1px solid var(--line)}
.iv-chatin{display:flex; gap:8px; margin-top:12px}
.iv-chatin input{flex:1; background:var(--abyss); border:1px solid var(--line); border-radius:11px;
  padding:11px 13px; color:var(--paper); outline:0; font-size:13.5px}

*:focus-visible{outline:2px solid var(--brass); outline-offset:2px}

.iv-mob-only{display:none}
@media (max-width:880px){
  .iv-shell{grid-template-columns:1fr}
  .iv-rail{flex-direction:row; justify-content:space-around; height:auto; width:100%; padding:8px 4px;
    border-right:0; border-top:1px solid var(--line); position:fixed; bottom:0; left:0; z-index:20;
    order:2; background:rgba(7,10,15,.9); padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))}
  .iv-mark{display:none}
  .iv-navbtn.on::before{display:none}
  .iv-main{order:1; padding-bottom:84px}
  .iv-topbar{padding:14px 18px}
  .iv-page{padding:18px}
  .iv-mob-hide{display:none}
  .iv-grid{grid-template-columns:1fr !important}
}
@media (prefers-reduced-motion:reduce){ .iv-aurora{animation:none} .iv-rule{transition:none} }
`;

/* ---------- helpers ---------- */
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (n: number, d = 2) => "$" + fmt(n, d);
const sign = (n: number) => (n >= 0 ? "+" : "");

function walk(start: number, n: number, vol: number, seed: number): number[] {
  let s = seed, v = start; const out: number[] = [];
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) { v = Math.max(1, v * (1 + (rnd() - 0.48) * vol)); out.push(v); }
  return out;
}
type Pt = { t: number; v: number };
const series = (arr: number[]): Pt[] => arr.map((v, i) => ({ t: i, v: +v.toFixed(2) }));

/* ---------- mock data (replace with API) ---------- */
type Holding = { sym: string; name: string; sh: number; px: number; chg: number; tone: string };
const HOLDINGS: Holding[] = [
  { sym: "VUAA", name: "Vanguard S&P 500 UCITS", sh: 612, px: 112.40, chg: 1.04, tone: "#5B7CFF" },
  { sym: "NVDA", name: "NVIDIA", sh: 210, px: 176.30, chg: 2.61, tone: "#76B900" },
  { sym: "AMZN", name: "Amazon", sh: 140, px: 223.10, chg: 0.92, tone: "#FF9900" },
  { sym: "GOOGL", name: "Alphabet", sh: 120, px: 198.45, chg: -0.43, tone: "#4285F4" },
  { sym: "AAPL", name: "Apple", sh: 95, px: 241.80, chg: 0.38, tone: "#C9CDD2" },
  { sym: "AVGO", name: "Broadcom", sh: 38, px: 342.60, chg: 1.74, tone: "#CC092F" },
  { sym: "NVO", name: "Novo Nordisk", sh: 160, px: 58.20, chg: -1.12, tone: "#001965" },
];
const PORT_SERIES: Record<string, Pt[]> = {
  "1M": series(walk(238000, 30, 0.012, 11)),
  "3M": series(walk(221000, 60, 0.013, 23)),
  "1Y": series(walk(182000, 120, 0.014, 41)),
  "ALL": series(walk(96000, 200, 0.016, 7)),
};
type ScanRow = { sym: string; name: string; last: number; chg: number; cat: string; tone: string; spark: number[] };
const SCAN: ScanRow[] = [
  { sym: "NVDA", name: "NVIDIA", last: 176.30, chg: 2.61, cat: "Semis", tone: "#76B900" },
  { sym: "AMD", name: "Advanced Micro Devices", last: 168.42, chg: 3.18, cat: "Semis", tone: "#ED1C24" },
  { sym: "AVGO", name: "Broadcom", last: 342.60, chg: 1.74, cat: "Semis", tone: "#CC092F" },
  { sym: "MRVL", name: "Marvell", last: 96.10, chg: -1.42, cat: "Semis", tone: "#0098DB" },
  { sym: "MU", name: "Micron", last: 118.77, chg: 2.04, cat: "Semis", tone: "#0033A0" },
  { sym: "INTC", name: "Intel", last: 24.18, chg: -2.31, cat: "Semis", tone: "#0071C5" },
  { sym: "ANET", name: "Arista Networks", last: 109.55, chg: 1.21, cat: "Big Tech", tone: "#2F80ED" },
  { sym: "DELL", name: "Dell Technologies", last: 132.90, chg: 0.64, cat: "Big Tech", tone: "#007DB8" },
  { sym: "AAPL", name: "Apple", last: 241.80, chg: 0.38, cat: "Big Tech", tone: "#C9CDD2" },
  { sym: "AMZN", name: "Amazon", last: 223.10, chg: 0.92, cat: "Big Tech", tone: "#FF9900" },
  { sym: "NVO", name: "Novo Nordisk", last: 58.20, chg: -1.12, cat: "Nordic", tone: "#001965" },
  { sym: "ASML", name: "ASML Holding", last: 812.40, chg: 1.88, cat: "Nordic", tone: "#0B5CD5" },
  { sym: "VUAA", name: "Vanguard S&P 500 UCITS", last: 112.40, chg: 1.04, cat: "ETF", tone: "#5B7CFF" },
  { sym: "SMCI", name: "Super Micro", last: 41.66, chg: -3.04, cat: "Semis", tone: "#7A2EA8" },
].map((r, i) => ({ ...r, spark: walk(r.last, 24, 0.02, i * 7 + 3) }));
const CATS = ["All", "Semis", "Big Tech", "Nordic", "ETF"];

const GOV_FUNCTIONS = [
  { k: "Social Security", v: 1450 }, { k: "Health", v: 920 }, { k: "Medicare", v: 870 },
  { k: "National Defense", v: 850 }, { k: "Net Interest", v: 880 }, { k: "Income Security", v: 670 },
  { k: "Veterans & Benefits", v: 320 }, { k: "Education & Training", v: 190 },
  { k: "Transportation", v: 130 }, { k: "Other", v: 320 },
];
const GOV_SPLIT = [
  { k: "Mandatory", v: 63, tone: "#D9B26A" },
  { k: "Discretionary", v: 27, tone: "#2BB8C4" },
  { k: "Net Interest", v: 10, tone: "#6D5AE0" },
];

/* portfolio context for the AI advisor (built from what's on screen) */
function advisorContext(): string {
  const value = HOLDINGS.reduce((a, h) => a + h.sh * h.px, 0);
  const lines = HOLDINGS.map(
    (h) => `- ${h.sym} (${h.name}) · ${h.sh} sh @ ${usd(h.px)} = ${usd(h.sh * h.px, 0)} · today ${sign(h.chg)}${h.chg}%`,
  );
  return [`Portfolio value ${usd(value, 0)} across ${HOLDINGS.length} positions.`, "Holdings:", ...lines].join("\n");
}

/* ---------- count-up hook ---------- */
function useCountUp(target: number, ms = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(target); return; }
    let raf = 0, t0: number | undefined;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const step = (t: number) => { t0 ??= t; const p = Math.min((t - t0) / ms, 1); setVal(target * ease(p)); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

/* ---------- small components ---------- */
const ChgTag = ({ v, big }: { v: number; big?: boolean }) => (
  <span className={v >= 0 ? "up" : "down"} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: big ? 14 : 13, fontWeight: 500 }}>
    {v >= 0 ? <ArrowUpRight size={big ? 16 : 14} /> : <ArrowDownRight size={big ? 16 : 14} />}
    {sign(v)}{fmt(v)}%
  </span>
);
const Badge = ({ sym, tone }: { sym: string; tone: string }) => (
  <div className="iv-badge" style={{ background: tone + "22", color: tone, border: `1px solid ${tone}44` }}>{sym[0]}</div>
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tip = ({ active, payload, prefix = "$" }: any) =>
  active && payload?.length ? (
    <div className="iv-tip"><div className="tt">point {payload[0].payload.t}</div>
      <div className="tv">{prefix}{fmt(payload[0].value)}</div></div>
  ) : null;

/* ============================== PORTFOLIO ============================== */
function Portfolio() {
  const [tf, setTf] = useState("1Y");
  const totals = useMemo(() => {
    const value = HOLDINGS.reduce((a, h) => a + h.sh * h.px, 0);
    const dayAbs = HOLDINGS.reduce((a, h) => a + h.sh * h.px * (h.chg / 100), 0);
    return { value, dayAbs, dayPct: (dayAbs / (value - dayAbs)) * 100 };
  }, []);
  const shown = useCountUp(totals.value);
  const data = PORT_SERIES[tf];
  const donut = HOLDINGS.map((h) => ({ name: h.sym, value: +(h.sh * h.px).toFixed(0), tone: h.tone }));

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div>
          <span className="iv-eyebrow">Portfolio</span>
          <div className="iv-display iv-hero-num">{usd(shown)}</div>
          <div className="iv-hero-sub">
            <ChgTag v={totals.dayPct} big /><span>·</span>
            <span className={totals.dayAbs >= 0 ? "up" : "down"}>{sign(totals.dayAbs)}{usd(totals.dayAbs)} today</span>
          </div>
          <div className="iv-rule" style={{ width: 64 }} />
        </div>
        <div className="iv-tabs">
          {["1M", "3M", "1Y", "ALL"].map((k) => (
            <button key={k} className={"iv-tab" + (tf === k ? " on" : "")} onClick={() => setTf(k)}>{k}</button>
          ))}
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 18 }}>
        <div className="iv-panel" style={{ paddingBottom: 14 }}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="pArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5BE0B0" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#5BE0B0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fill: "#8A93A3", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,.2)" }} />
                <Area type="monotone" dataKey="v" stroke="#5BE0B0" strokeWidth={2} fill="url(#pArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "minmax(280px,1fr) 1.6fr" }}>
        <div className="iv-panel">
          <span className="iv-eyebrow">Allocation</span>
          <div style={{ height: 200, marginTop: 10 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut} dataKey="value" innerRadius={56} outerRadius={86} paddingAngle={2} stroke="none">
                  {donut.map((d, i) => <Cell key={i} fill={d.tone} />)}
                </Pie>
                <Tooltip content={<Tip prefix="$" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {donut.map((d) => (
              <span key={d.name} className="iv-mono" style={{ fontSize: 11.5, color: "#8A93A3", display: "flex", alignItems: "center", gap: 6 }}>
                <i style={{ width: 8, height: 8, borderRadius: 2, background: d.tone, display: "inline-block" }} />{d.name}
              </span>
            ))}
          </div>
        </div>

        <div className="iv-panel">
          <span className="iv-eyebrow">Holdings</span>
          <table className="iv-tbl" style={{ marginTop: 12 }}>
            <thead><tr><th>Position</th><th className="iv-mob-hide">Shares</th><th>Price</th><th>Value</th><th>Day</th></tr></thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.sym}>
                  <td><div className="iv-sym"><Badge sym={h.sym} tone={h.tone} />
                    <div><div style={{ fontWeight: 600 }}>{h.sym}</div><div className="iv-symname iv-mob-hide">{h.name}</div></div></div></td>
                  <td className="iv-mono iv-mob-hide">{h.sh}</td>
                  <td className="iv-mono">{usd(h.px)}</td>
                  <td className="iv-mono">{usd(h.sh * h.px, 0)}</td>
                  <td style={{ textAlign: "right" }}><ChgTag v={h.chg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== MARKETS ============================== */
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const d = data.map((v, i) => ({ t: i, v }));
  return (
    <div style={{ width: 92, height: 34 }}>
      <ResponsiveContainer>
        <LineChart data={d}><Line type="monotone" dataKey="v" stroke={up ? "#5BE0B0" : "#FF6B7A"} strokeWidth={1.6} dot={false} /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function Markets() {
  const [cat, setCat] = useState("All");
  const [sortK, setSortK] = useState<"last" | "chg">("chg");
  const [asc, setAsc] = useState(false);
  const rows = useMemo(() => {
    let r = cat === "All" ? SCAN : SCAN.filter((x) => x.cat === cat);
    r = [...r].sort((a, b) => (a[sortK] < b[sortK] ? -1 : 1) * (asc ? 1 : -1));
    return r;
  }, [cat, sortK, asc]);
  const movers = [...SCAN].sort((a, b) => b.chg - a.chg);
  const top = movers.slice(0, 3), bottom = movers.slice(-3).reverse();
  const head = (k: "last" | "chg", lbl: string) => (
    <th onClick={() => { if (sortK === k) setAsc(!asc); else { setSortK(k); setAsc(false); } }}>
      {lbl}{sortK === k ? (asc ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div><span className="iv-eyebrow">Markets</span>
          <div className="iv-display" style={{ fontSize: 34, marginTop: 6 }}>Scanner</div>
          <div className="iv-rule" /></div>
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, marginBottom: 18 }}>
        {[...top, ...bottom].map((m) => (
          <div className="iv-mover" key={m.sym}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{m.sym}</span><Spark data={m.spark} up={m.chg >= 0} />
            </div>
            <div className="iv-mono" style={{ fontSize: 13, marginTop: 4 }}>{usd(m.last)}</div>
            <ChgTag v={m.chg} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 }}>
        {CATS.map((c) => <button key={c} className={"iv-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <div className="iv-panel">
        <table className="iv-tbl">
          <thead><tr><th>Instrument</th>{head("last", "Last")}{head("chg", "Change")}<th className="iv-mob-hide">Trend</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sym}>
                <td><div className="iv-sym"><Badge sym={r.sym} tone={r.tone} />
                  <div><div style={{ fontWeight: 600 }}>{r.sym}</div><div className="iv-symname">{r.name}</div></div></div></td>
                <td className="iv-mono">{usd(r.last)}</td>
                <td style={{ textAlign: "right" }}><ChgTag v={r.chg} /></td>
                <td className="iv-mob-hide" style={{ textAlign: "right" }}><div style={{ display: "flex", justifyContent: "flex-end" }}><Spark data={r.spark} up={r.chg >= 0} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== TRADE ============================== */
function Trade() {
  const [tf, setTf] = useState("1D");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState(10);
  const px = 176.30; const limit = (px * 0.995).toFixed(2);
  const tfMap: Record<string, [number, number, number]> = { "1D": [78, 0.006, 5], "1W": [60, 0.01, 9], "1M": [60, 0.014, 13], "3M": [60, 0.02, 17], "1Y": [120, 0.025, 21] };
  const [n, vol, seed] = tfMap[tf];
  const price = series(walk(px, n, vol, seed));
  const volm = price.map((p, i) => ({ t: i, vol: Math.round(200 + Math.abs(Math.sin(i * 1.3)) * 800) }));
  const merged = price.map((p, i) => ({ ...p, vol: volm[i].vol }));

  const mid = px; const book: { side: string; px: number; sz: number }[] = [];
  for (let i = 5; i >= 1; i--) book.push({ side: "ask", px: +(mid + i * 0.12).toFixed(2), sz: Math.round(40 + ((i * 53) % 260)) });
  const bids: { side: string; px: number; sz: number }[] = [];
  for (let i = 1; i <= 5; i++) bids.push({ side: "bid", px: +(mid - i * 0.12).toFixed(2), sz: Math.round(40 + ((i * 71) % 260)) });
  const maxSz = Math.max(...[...book, ...bids].map((b) => b.sz));

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge sym="N" tone="#76B900" />
          <div>
            <span className="iv-eyebrow">Trade</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span className="iv-display" style={{ fontSize: 34 }}>NVDA</span>
              <span className="iv-mono" style={{ fontSize: 20 }}>{usd(px)}</span>
              <ChgTag v={2.61} big />
            </div>
          </div>
        </div>
        <div className="iv-tabs">
          {["1D", "1W", "1M", "3M", "1Y"].map((k) => (
            <button key={k} className={"iv-tab" + (tf === k ? " on" : "")} onClick={() => setTf(k)}>{k}</button>
          ))}
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "1.7fr minmax(300px,1fr)" }}>
        <div className="iv-panel" style={{ paddingBottom: 12 }}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={merged} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="tArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#76B900" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#76B900" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis yAxisId="p" tick={{ fill: "#8A93A3", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={52} domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(v: number) => "$" + v.toFixed(0)} />
                <YAxis yAxisId="v" hide domain={[0, 4000]} />
                <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,.2)" }} />
                <Bar yAxisId="v" dataKey="vol" fill="rgba(255,255,255,.07)" radius={[2, 2, 0, 0]} />
                <Area yAxisId="p" type="monotone" dataKey="v" stroke="#9ACD32" strokeWidth={2} fill="url(#tArea)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="iv-panel">
            <div className="iv-seg">
              <button className={side === "buy" ? "buy" : ""} onClick={() => setSide("buy")}>Buy</button>
              <button className={side === "sell" ? "sell" : ""} onClick={() => setSide("sell")}>Sell</button>
            </div>
            <div className="iv-tabs" style={{ marginTop: 14, width: "100%" }}>
              {(["market", "limit"] as const).map((t) => (
                <button key={t} className={"iv-tab" + (type === t ? " on" : "")} style={{ flex: 1, textTransform: "capitalize" }} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>
            <div className="iv-field">
              <label>Quantity</label>
              <div className="iv-input">
                <button className="iv-stepper" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={14} /></button>
                <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} style={{ textAlign: "center" }} />
                <button className="iv-stepper" onClick={() => setQty(qty + 1)}><Plus size={14} /></button>
              </div>
              <input type="range" min="1" max="200" value={qty} onChange={(e) => setQty(+e.target.value)} style={{ marginTop: 6 }} />
            </div>
            {type === "limit" && (
              <div className="iv-field"><label>Limit price</label>
                <div className="iv-input"><span className="iv-mono" style={{ color: "#8A93A3" }}>$</span>
                  <input type="text" defaultValue={limit} /></div></div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, color: "#8A93A3", fontSize: 13 }}>
              <span>Estimated {side === "buy" ? "cost" : "credit"}</span>
              <span className="iv-mono" style={{ color: "#ECEAE3", fontSize: 16 }}>{usd(qty * px)}</span>
            </div>
            <button className={"iv-cta " + side}>{side === "buy" ? "Review buy order" : "Review sell order"}</button>
            <p style={{ fontSize: 11, color: "#8A93A3", marginTop: 10, textAlign: "center" }}>Paper trade · demo only, no order is placed.</p>
          </div>

          <div className="iv-panel">
            <span className="iv-eyebrow">Order book</span>
            <div style={{ marginTop: 12 }}>
              {book.map((b, i) => (
                <div className="iv-book-row" key={"a" + i}>
                  <span className="down">{b.px.toFixed(2)}</span><span style={{ color: "#8A93A3" }}>{b.sz}</span>
                  <div className="iv-depth" style={{ width: (b.sz / maxSz) * 100 + "%", background: "rgba(255,107,122,.12)" }} />
                </div>
              ))}
              <div className="iv-spread"><span>spread</span><span>{(0.12).toFixed(2)} · 0.07%</span></div>
              {bids.map((b, i) => (
                <div className="iv-book-row" key={"b" + i}>
                  <span className="up">{b.px.toFixed(2)}</span><span style={{ color: "#8A93A3" }}>{b.sz}</span>
                  <div className="iv-depth" style={{ width: (b.sz / maxSz) * 100 + "%", background: "rgba(91,224,176,.12)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== ADVISOR (live Claude) ============================== */
function Advisor() {
  const [activeId, setActiveId] = useState(MENTORS[0].id);
  const [connected, setConnected] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [threads, setThreads] = useState<Record<string, { who: "me" | "ai"; text: string }[]>>(() =>
    Object.fromEntries(MENTORS.map((m) => [m.id, [{ who: "ai" as const, text: `I'm your ${m.name}. Ask about a holding, risk, or strategy.` }]])),
  );
  useEffect(() => setConnected(hasKey()), []);
  const active = MENTORS.find((m) => m.id === activeId)!;

  function saveKey() {
    if (!keyInput.trim()) return;
    setApiKey(keyInput);
    setConnected(true);
    setKeyInput("");
  }

  async function send() {
    const v = input.trim();
    if (!v || busy) return;
    setInput("");
    const id = activeId;
    setThreads((p) => ({ ...p, [id]: [...p[id], { who: "me", text: v }] }));
    if (!hasKey()) {
      setTimeout(() => setThreads((p) => ({ ...p, [id]: [...p[id], { who: "ai", text: active.fallback(v) }] })), 300);
      return;
    }
    setBusy(true);
    try {
      const history: AiMsg[] = threads[id].filter((_, i) => i > 0).map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.text }));
      history.push({ role: "user", content: v });
      const system = active.systemPrompt + "\n\nThe user's portfolio (reason about these specifics):\n" + advisorContext();
      const reply = await chat(system, history, 500);
      setThreads((p) => ({ ...p, [id]: [...p[id], { who: "ai", text: reply || active.fallback(v) }] }));
    } catch (e) {
      setThreads((p) => ({ ...p, [id]: [...p[id], { who: "ai", text: active.fallback(v) + `\n\n(Live AI unavailable: ${e instanceof Error ? e.message.slice(0, 70) : "error"})` }] }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div><span className="iv-eyebrow">Advisor</span>
          <div className="iv-display" style={{ fontSize: 34, marginTop: 6 }}>AI Council</div>
          <div className="iv-hero-sub">
            {connected
              ? <span className="iv-tag" style={{ color: "var(--up)", borderColor: "rgba(91,224,176,.4)" }}><Circle size={8} /> Live Claude</span>
              : <span className="iv-tag"><Circle size={8} /> Demo · add a key</span>}
          </div>
          <div className="iv-rule" /></div>
      </div>

      {!connected && (
        <div className="iv-panel" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="iv-badge" style={{ background: "rgba(217,178,106,.14)", color: "var(--brass)" }}><KeyRound size={16} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600 }}>Connect Claude</div>
              <div style={{ fontSize: 12.5, color: "#8A93A3" }}>Paste your Anthropic key (stored only in this browser) to make the council reason live.</div>
            </div>
          </div>
          <div className="iv-chatin">
            <input type="password" placeholder="sk-ant-…" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
            <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "0 18px" }} onClick={saveKey}>Connect</button>
          </div>
        </div>
      )}

      <div className="iv-grid" style={{ gridTemplateColumns: "minmax(220px,0.8fr) 1.6fr" }}>
        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          {MENTORS.map((m) => (
            <button key={m.id} className={"iv-mentor" + (m.id === activeId ? " on" : "")} onClick={() => setActiveId(m.id)}>
              <span className="mi"><m.Icon size={20} strokeWidth={1.75} /></span>
              <span>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                <span style={{ fontSize: 11.5, color: "#8A93A3" }}>{m.focus}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="iv-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span className="mi" style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(217,178,106,.14)", color: "var(--brass)" }}>
              <active.Icon size={17} strokeWidth={1.75} />
            </span>
            <span style={{ fontWeight: 600 }}>{active.name}</span>
          </div>
          <div className="iv-chatbox">
            {threads[activeId].map((m, i) => (
              <div key={i} className={"iv-bub " + m.who}>{m.text}</div>
            ))}
            {busy && <div className="iv-bub ai" style={{ color: "#8A93A3" }}>thinking…</div>}
          </div>
          <div className="iv-chatin">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about a holding, risk, dividends…" />
            <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "0 16px", display: "grid", placeItems: "center" }} onClick={send} disabled={busy} aria-label="Send"><Send size={16} /></button>
          </div>
          <p style={{ fontSize: 11, color: "#8A93A3", marginTop: 10 }}>Educational only, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}

/* ============================== GOVERNMENT ============================== */
function Government() {
  const total = GOV_FUNCTIONS.reduce((a, f) => a + f.v, 0);
  const maxF = Math.max(...GOV_FUNCTIONS.map((f) => f.v));
  const shownT = useCountUp(total);
  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div>
          <span className="iv-eyebrow">Federal Spending</span>
          <div className="iv-display iv-hero-num" style={{ fontSize: "clamp(36px,5vw,58px)" }}>${fmt(shownT / 1000, 2)}T</div>
          <div className="iv-hero-sub"><span>Total outlays · fiscal year</span><span className="iv-tag"><Circle size={8} /> Sample data</span></div>
          <div className="iv-rule" />
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>
        <div className="iv-stat"><div className="k">Receipts</div><div className="v">$4.9T</div></div>
        <div className="iv-stat"><div className="k">Deficit</div><div className="v down">−$2.0T</div></div>
        <div className="iv-stat"><div className="k">Debt held public</div><div className="v">$28.9T</div></div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "minmax(280px,1fr) 1.7fr" }}>
        <div className="iv-panel">
          <span className="iv-eyebrow">Mandatory vs discretionary</span>
          <div style={{ height: 200, marginTop: 10 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={GOV_SPLIT} dataKey="v" innerRadius={56} outerRadius={86} paddingAngle={2} stroke="none">
                  {GOV_SPLIT.map((d, i) => <Cell key={i} fill={d.tone} />)}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip content={({ active, payload }: any) => active && payload?.length ? <div className="iv-tip"><div className="tt">{payload[0].payload.k}</div><div className="tv">{payload[0].value}%</div></div> : null} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
            {GOV_SPLIT.map((d) => (
              <span key={d.k} className="iv-mono" style={{ fontSize: 11.5, color: "#8A93A3", display: "flex", alignItems: "center", gap: 6 }}>
                <i style={{ width: 8, height: 8, borderRadius: 2, background: d.tone, display: "inline-block" }} />{d.k} {d.v}%
              </span>
            ))}
          </div>
        </div>

        <div className="iv-panel">
          <span className="iv-eyebrow">Where it goes · outlays by function</span>
          <div style={{ marginTop: 14 }}>
            {GOV_FUNCTIONS.map((f) => (
              <div className="iv-fnrow" key={f.k}>
                <span style={{ fontSize: 13.5 }}>{f.k}</span>
                <div className="iv-track"><div className="iv-fill" style={{ width: (f.v / maxF) * 100 + "%" }} /></div>
                <span className="iv-mono" style={{ fontSize: 13, color: "#ECEAE3", minWidth: 64, textAlign: "right" }}>${fmt(f.v / 1000, 2)}T</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="iv-panel" style={{ marginTop: 18 }}>
        <span className="iv-eyebrow">Appropriations status · current bill</span>
        <div className="iv-fnrow" style={{ gridTemplateColumns: "200px 1fr auto", marginTop: 12 }}>
          <span style={{ fontSize: 14 }}>Full-year appropriations enacted</span>
          <div className="iv-track"><div className="iv-fill" style={{ width: "72%", background: "linear-gradient(90deg,#5BE0B0,#2BB8C4)" }} /></div>
          <span className="iv-mono" style={{ fontSize: 13 }}>9 / 12 bills</span>
        </div>
        <p className="iv-foot">
          Figures shown are illustrative placeholders. Connect live numbers from the U.S. Treasury{" "}
          <a href="https://fiscaldata.treasury.gov/api-documentation" target="_blank" rel="noreferrer">FiscalData API</a>{" "}
          (outlays, receipts, deficit, debt) and{" "}
          <a href="https://api.usaspending.gov" target="_blank" rel="noreferrer">USAspending.gov</a>{" "}
          (spending by agency, function, and award). Both are free and require no key.
        </p>
      </div>
    </div>
  );
}

/* ============================== SHELL ============================== */
const NAV = [
  { id: "portfolio", label: "Folio", Icon: Wallet, View: Portfolio },
  { id: "markets", label: "Markets", Icon: Radar, View: Markets },
  { id: "trade", label: "Trade", Icon: Activity, View: Trade },
  { id: "advisor", label: "Advisor", Icon: Sparkles, View: Advisor },
  { id: "gov", label: "Gov", Icon: Landmark, View: Government },
];

export default function Observatory() {
  const [active, setActive] = useState("portfolio");
  const View = NAV.find((n) => n.id === active)!.View;
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick(); const id = setInterval(tick, 30000); return () => clearInterval(id);
  }, []);

  return (
    <div className="iv-root">
      <style>{CSS}</style>
      <div className="iv-aurora" />
      <div className="iv-shell">
        <nav className="iv-rail">
          <div className="iv-mark">O</div>
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={"iv-navbtn" + (active === id ? " on" : "")} onClick={() => setActive(id)} aria-label={label} aria-current={active === id}>
              <Icon size={21} strokeWidth={1.8} />
              <span className="iv-navlbl">{label}</span>
            </button>
          ))}
        </nav>

        <div className="iv-main">
          <div className="iv-topbar">
            <div className="iv-srch"><Search size={16} /><input placeholder="Search ticker, fund, or agency…" /></div>
            <div className="iv-pill iv-mob-hide"><span className="dot-live" /> Markets open</div>
            <div className="iv-pill iv-mob-hide"><Clock size={14} /> <span className="iv-mono">{clock}</span></div>
            <button className="iv-icon-btn" aria-label="Notifications"><Bell size={17} /></button>
          </div>
          <View />
        </div>
      </div>
    </div>
  );
}
