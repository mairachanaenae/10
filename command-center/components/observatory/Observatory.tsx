"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Wallet, Radar, Activity, Landmark, Search, Plus, Minus, Clock, Circle,
  ArrowUpRight, ArrowDownRight, Sparkles, KeyRound, Send, X, Map as MapIcon,
  Newspaper, History, Target, GraduationCap, Compass,
} from "lucide-react";
import { Town } from "./Town";
import { NewsView, HistoryView, GoalsView, AcademyView, OpportunitiesView } from "./Workspaces";
import { MENTORS } from "@/lib/mentors";
import { chat, ask, hasKey, getApiKey, setApiKey, clearApiKey, type Msg as AiMsg } from "@/lib/browser-ai";
import { fetchQuotes, type Quote } from "@/lib/market-api";
import { hasNewsKey, getNewsKey, setNewsKey, clearNewsKey, fetchNews } from "@/lib/news-api";
import { fetchGov, type GovData } from "@/lib/gov-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoldings, upsertHolding, removeHolding, resetHoldings, type Position } from "@/lib/holdings-store";
import { computeMetrics, needsRebalance, type PortfolioMetrics } from "@/lib/analytics";
import { summarizer, anomalyFlagger, stewardReport, type AgentResult } from "@/lib/agents";
import { propose, approve, dismiss, usePendingApprovals } from "@/lib/approvals";
import { useAudit } from "@/lib/audit";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.iv-root *{box-sizing:border-box;margin:0;padding:0}
.iv-root{
  /* Warm editorial: cream paper, ink charcoal, olive + brick (taste pass) */
  --ink:#F4F1E8; --paper:#272320; --surface:#FCFAF4; --abyss:#FFFFFF; --mute:#6B6358;
  --line:rgba(39,35,32,.14); --line2:rgba(39,35,32,.07);
  --frost:rgba(39,35,32,.03); --frost2:rgba(39,35,32,.05);
  --up:#3E6B52; --down:#B0463F; --warn:#9A6B2E;
  --cyan:#3E6B52; --gold:#9A6B2E; --magenta:#7A5C86; --brass:#3E6B52;
  position:fixed; inset:0; overflow:hidden;
  background:var(--ink); color:var(--paper);
  font-family:'Inter',system-ui,sans-serif; font-size:14px; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.iv-aurora{display:none}

.iv-display{font-family:'Newsreader',Georgia,serif; font-weight:500; letter-spacing:-.01em; color:var(--paper)}
.iv-mono{font-family:'JetBrains Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums}
.iv-eyebrow{font-family:'Inter',sans-serif; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--mute); font-weight:600}
.up{color:var(--up)} .down{color:var(--down)} .brass{color:var(--cyan)}

.iv-shell{position:relative; z-index:1; display:grid; grid-template-columns:84px 1fr; height:100%}
.iv-rail{display:flex; flex-direction:column; align-items:center; gap:4px; padding:20px 0;
  border-right:1px solid var(--line); background:#EEEADF; overflow-y:auto; scrollbar-width:none}
.iv-rail::-webkit-scrollbar{display:none}
.iv-mark{width:34px; height:34px; border-radius:10px; margin-bottom:20px; background:var(--paper);
  display:grid; place-items:center; font-family:'Newsreader',serif; font-weight:600; color:var(--ink); font-size:18px}
.iv-navbtn{position:relative; width:52px; height:52px; border:0; background:transparent; cursor:pointer;
  border-radius:12px; color:var(--mute); display:grid; place-items:center; transition:.18s}
.iv-navbtn:hover{color:var(--paper); background:rgba(39,35,32,.05)}
.iv-navbtn.on{color:var(--paper); background:rgba(39,35,32,.07)}
.iv-navbtn.on::before{content:""; position:absolute; left:-1px; top:14px; bottom:14px; width:3px; border-radius:3px; background:var(--cyan)}
.iv-navlbl{font-size:9.5px; letter-spacing:.04em; margin-top:2px}

.iv-main{overflow-y:auto; overflow-x:hidden; padding:0}
.iv-topbar{position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:16px; padding:15px 30px;
  border-bottom:1px solid var(--line); background:rgba(244,241,232,.9); backdrop-filter:blur(8px)}
.iv-srch{flex:1; max-width:420px; display:flex; align-items:center; gap:10px; padding:9px 14px;
  background:var(--surface); border:1px solid var(--line); border-radius:10px; color:var(--mute)}
.iv-srch input{background:transparent; border:0; outline:0; color:var(--paper); width:100%; font-size:13.5px}
.iv-srch input::placeholder{color:var(--mute)}
.iv-pill{display:flex; align-items:center; gap:7px; padding:7px 12px; border-radius:9px; border:1px solid var(--line); background:var(--surface); font-size:13px}
.iv-icon-btn{width:38px; height:38px; border-radius:10px; border:1px solid var(--line); background:var(--surface); color:var(--mute); display:grid; place-items:center; cursor:pointer}
.iv-icon-btn:hover{color:var(--paper)}
.dot-live{width:7px; height:7px; border-radius:50%; background:var(--up)}

.iv-page{padding:34px; max-width:1240px; margin:0 auto}
.iv-pagehead{display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:24px; flex-wrap:wrap}

.iv-panel{position:relative; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:24px;
  box-shadow:0 1px 2px rgba(39,35,32,.04), 0 10px 28px -20px rgba(39,35,32,.25); min-width:0}
.iv-grid{display:grid; gap:20px; min-width:0}
.iv-grid > *{min-width:0}

.iv-hero-num{font-size:clamp(36px,5vw,56px); font-weight:500; line-height:1.05; margin:8px 0 6px}
.iv-hero-sub{display:flex; align-items:center; gap:10px; color:var(--mute); font-size:14px; flex-wrap:wrap}
.iv-rule{height:1px; width:54px; margin-top:18px; background:var(--cyan)}

.iv-tabs{display:inline-flex; gap:2px; padding:3px; border-radius:9px; background:rgba(39,35,32,.05); border:1px solid var(--line)}
.iv-tab{border:0; background:transparent; color:var(--mute); padding:6px 13px; border-radius:7px; cursor:pointer; font-size:12.5px; font-weight:500}
.iv-tab.on{background:var(--surface); color:var(--paper); box-shadow:0 1px 2px rgba(39,35,32,.12)}

.iv-tbl{width:100%; border-collapse:collapse}
.iv-tbl th{text-align:right; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--mute); font-weight:600; padding:0 0 14px; cursor:pointer; user-select:none}
.iv-tbl th:first-child,.iv-tbl td:first-child{text-align:left}
.iv-tbl td{padding:14px 0; border-top:1px solid var(--line2); font-size:14px}
.iv-tbl tr:hover td{background:rgba(39,35,32,.02)}
.iv-sym{display:flex; align-items:center; gap:12px}
.iv-badge{width:36px; height:36px; border-radius:9px; display:grid; place-items:center; font-family:'Newsreader',serif; font-weight:600; font-size:15px; flex:none}
.iv-symname{font-size:12px; color:var(--mute)}

.iv-chip{border:1px solid var(--line); background:var(--surface); color:var(--mute); padding:7px 14px; border-radius:999px; cursor:pointer; font-size:12.5px; font-weight:500}
.iv-chip.on{background:var(--cyan); border-color:var(--cyan); color:#FBF9F3; font-weight:600}

.iv-mover{flex:none; min-width:150px; padding:14px 16px; border-radius:12px; background:var(--surface); border:1px solid var(--line); transition:transform .2s cubic-bezier(.16,1,.3,1)}
.iv-mover:hover{transform:translateY(-2px)}

.iv-seg{display:flex; padding:3px; border-radius:10px; background:rgba(39,35,32,.05); border:1px solid var(--line)}
.iv-seg button{flex:1; border:0; background:transparent; color:var(--mute); padding:10px; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px}
.iv-seg button.buy{background:var(--up); color:#FBF9F3}
.iv-seg button.sell{background:var(--down); color:#FBF9F3}
.iv-field{display:flex; flex-direction:column; gap:7px; margin-top:16px}
.iv-field label{font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--mute)}
.iv-input{display:flex; align-items:center; gap:8px; padding:11px 13px; border-radius:10px; background:var(--abyss); border:1px solid var(--line)}
.iv-input input{flex:1; background:transparent; border:0; outline:0; color:var(--paper); font-family:'JetBrains Mono',monospace; font-size:16px}
.iv-stepper{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--paper);cursor:pointer;display:grid;place-items:center}
.iv-cta{width:100%; margin-top:20px; padding:13px; border:0; border-radius:10px; cursor:pointer; font-weight:600; font-size:14px; transition:transform .15s ease, filter .2s ease}
.iv-cta:active{transform:translateY(1px)}
.iv-cta.buy{background:var(--up); color:#FBF9F3} .iv-cta.sell{background:var(--down); color:#FBF9F3}
.iv-cta.brassbtn{background:var(--paper); color:var(--ink)}
.iv-cta.brassbtn:hover{filter:brightness(1.12)}
input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:4px;background:var(--line);outline:0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;
  background:var(--cyan);cursor:pointer;box-shadow:0 0 0 3px rgba(62,107,82,.16)}

.iv-book-row{position:relative; display:flex; justify-content:space-between; padding:5px 10px; font-family:'JetBrains Mono',monospace; font-size:12.5px; border-radius:6px}
.iv-depth{position:absolute; top:0; bottom:0; right:0; border-radius:6px; z-index:0}
.iv-book-row span{position:relative; z-index:1}
.iv-spread{display:flex; justify-content:space-between; padding:9px 10px; margin:4px 0; border-top:1px solid var(--line2); border-bottom:1px solid var(--line2); font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--mute)}

.iv-fnrow{display:grid; grid-template-columns:160px 1fr auto; gap:14px; align-items:center; padding:9px 0}
.iv-track{height:9px; border-radius:6px; background:rgba(39,35,32,.08); overflow:hidden}
.iv-fill{height:100%; border-radius:6px; background:var(--cyan)}
.iv-tag{display:inline-flex; align-items:center; gap:6px; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; font-family:'Inter',sans-serif; color:var(--mute); border:1px solid var(--line); padding:4px 9px; border-radius:999px}
.iv-foot{font-size:11.5px; color:var(--mute); margin-top:20px; line-height:1.6}
.iv-foot a{color:var(--cyan); text-decoration:underline}

.iv-stat{position:relative; padding:18px 20px; border-radius:12px; background:var(--surface); border:1px solid var(--line)}
.iv-stat .k{font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--mute)}
.iv-stat .v{font-family:'Newsreader',serif; font-weight:600; font-size:28px; margin-top:6px}

.iv-tip{background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:10px 13px; box-shadow:0 10px 28px -14px rgba(39,35,32,.35)}
.iv-tip .tt{font-size:11px; color:var(--mute)} .iv-tip .tv{font-family:'JetBrains Mono',monospace; font-size:14px; margin-top:3px; color:var(--paper)}

.iv-mentor{display:flex; align-items:center; gap:12px; width:100%; text-align:left; cursor:pointer; padding:12px 14px; border-radius:12px; border:1px solid var(--line); background:var(--surface); color:var(--paper); transition:.15s}
.iv-mentor:hover{background:rgba(39,35,32,.03)}
.iv-mentor.on{border-color:var(--cyan); background:rgba(62,107,82,.07)}
.iv-mentor .mi{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;flex:none; background:rgba(62,107,82,.1); color:var(--cyan)}
.iv-chatbox{display:flex; flex-direction:column; gap:10px; height:340px; overflow:auto; padding-right:4px}
.iv-bub{max-width:84%; padding:10px 13px; border-radius:12px; font-size:13.5px; line-height:1.55; white-space:pre-wrap}
.iv-bub.me{align-self:flex-end; background:rgba(62,107,82,.1); border:1px solid rgba(62,107,82,.2)}
.iv-bub.ai{align-self:flex-start; background:rgba(39,35,32,.04); border:1px solid var(--line)}
.iv-chatin{display:flex; gap:8px; margin-top:12px}
.iv-chatin input{flex:1; background:var(--abyss); border:1px solid var(--line); border-radius:10px; padding:11px 13px; color:var(--paper); outline:0; font-size:13.5px}

*:focus-visible{outline:2px solid var(--cyan); outline-offset:2px}

.iv-kpi{position:relative; overflow:hidden; border-radius:14px; padding:18px 20px; background:var(--surface); border:1px solid var(--line); transition:transform .2s cubic-bezier(.16,1,.3,1), border-color .2s ease}
.iv-kpi:hover{transform:translateY(-2px); border-color:rgba(39,35,32,.22)}
.iv-kpi .lab{font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--mute)}
.iv-kpi .val{font-family:'Newsreader',serif; font-weight:600; font-size:28px; margin-top:9px; line-height:1}
.iv-kpi .meta{font-size:12px; color:var(--mute); margin-top:6px}
.iv-kpi.feature{background:linear-gradient(150deg, rgba(62,107,82,.09), var(--surface) 62%)}

.iv-word{font-family:'Newsreader',serif; font-weight:600; letter-spacing:.005em; font-size:16px; white-space:nowrap}
.iv-word .dim{color:var(--mute); font-weight:400}

@keyframes ivrise{from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none}}
.iv-page > *{animation:ivrise .5s cubic-bezier(.16,1,.3,1) both}
.iv-page > *:nth-child(2){animation-delay:.05s}
.iv-page > *:nth-child(3){animation-delay:.1s}
.iv-page > *:nth-child(4){animation-delay:.15s}
.iv-page > *:nth-child(n+5){animation-delay:.2s}
@media (prefers-reduced-motion:reduce){ .iv-page > *{animation:none} }

.iv-mob-only{display:none}
@media (max-width:880px){
  .iv-shell{grid-template-columns:1fr}
  .iv-rail{flex-direction:row; justify-content:flex-start; height:auto; width:100%; padding:8px 8px; gap:2px;
    border-right:0; border-top:1px solid var(--line); position:fixed; bottom:0; left:0; z-index:20; order:2;
    background:#EEEADF; overflow-x:auto; padding-bottom:calc(8px + env(safe-area-inset-bottom,0px)); -webkit-overflow-scrolling:touch}
  .iv-navbtn{flex:0 0 auto; width:58px}
  .iv-mark{display:none}
  .iv-navbtn.on::before{display:none}
  .iv-main{order:1; padding-bottom:84px}
  .iv-topbar{padding:14px 18px}
  .iv-page{padding:18px}
  .iv-mob-hide{display:none}
  .iv-grid{grid-template-columns:1fr !important}
  .iv-panel{padding:18px}
  .iv-tbl th,.iv-tbl td{font-size:12.5px}
  .iv-tbl td{padding:12px 0}
  .iv-pagehead{gap:12px}
  .iv-tabs{flex-wrap:wrap}
  .iv-tbl{display:block; overflow-x:auto; -webkit-overflow-scrolling:touch}
}
@media (max-width:560px){ .iv-hero-num{font-size:34px} .iv-page{padding:14px} }
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
type Holding = Position; // positions come from the persistent store
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
function advisorContext(holdings: Position[]): string {
  const value = holdings.reduce((a, h) => a + h.sh * h.px, 0);
  const lines = holdings.map(
    (h) => `- ${h.sym} (${h.name}) · ${h.sh} sh @ ${usd(h.px)} = ${usd(h.sh * h.px, 0)} · target ${h.target ?? 0}% · today ${sign(h.chg ?? 0)}${h.chg ?? 0}%`,
  );
  return [`Portfolio value ${usd(value, 0)} across ${holdings.length} positions.`, "Holdings:", ...lines].join("\n");
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

/* ---------- live quotes hook (Finnhub, optional) ---------- */
type QuoteStatus = "off" | "loading" | "live" | "error";
function useLiveQuotes(symbols: string[]): { q: Record<string, Quote>; live: boolean; status: QuoteStatus } {
  const [q, setQ] = useState<Record<string, Quote>>({});
  const [status, setStatus] = useState<QuoteStatus>("off");
  const keyset = symbols.join(",");
  useEffect(() => {
    if (!hasNewsKey()) { setStatus("off"); return; }
    let alive = true;
    setStatus("loading");
    fetchQuotes(keyset.split(","))
      .then((res) => { if (!alive) return; if (Object.keys(res).length) { setQ(res); setStatus("live"); } else setStatus("error"); })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [keyset]);
  return { q, live: status === "live", status };
}
function quoteBadge(status: QuoteStatus, liveLabel: string) {
  const map: Record<QuoteStatus, { t: string; c?: string }> = {
    off: { t: "Sample · add key" }, loading: { t: "Fetching quotes…" },
    live: { t: liveLabel, c: "var(--up)" }, error: { t: "Live unavailable · sample", c: "var(--down)" },
  };
  return map[status];
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
  const [editing, setEditing] = useState(false);
  const holdings = useHoldings();
  const { q, status } = useLiveQuotes(holdings.map((h) => h.quoteSym || h.sym));
  const qb = quoteBadge(status, "Live quotes");
  const rows: Position[] = holdings.map((h) => {
    const quote = q[h.quoteSym || h.sym];
    return { ...h, px: quote?.last ?? h.px, chg: quote?.chg ?? h.chg ?? 0 };
  });
  const metrics = useMemo(() => computeMetrics(rows), [rows]);
  const totals = { value: metrics.total, dayPct: metrics.dayChangePct, dayAbs: (metrics.dayChangePct / 100) * metrics.total };
  const shown = useCountUp(totals.value);
  const data = PORT_SERIES[tf];
  const donut = rows.map((h) => ({ name: h.sym, value: +(h.sh * h.px).toFixed(0), tone: h.tone }));

  return (
    <div className="iv-page">
      <div className="iv-pagehead" style={{ marginBottom: 14 }}>
        <div>
          <span className="iv-eyebrow">Portfolio</span>
          <div className="iv-display" style={{ fontSize: 30, marginTop: 4 }}>Overview</div>
        </div>
        <span className="iv-tag" style={qb.c ? { color: qb.c, borderColor: qb.c } : undefined}>
          <Circle size={8} /> {qb.t}
        </span>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", marginBottom: 18 }}>
        <div className="iv-kpi feature">
          <div className="lab">Net worth</div>
          <div className="val">{usd(shown, 0)}</div>
          <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ChgTag v={totals.dayPct} /> {sign(totals.dayAbs)}{usd(totals.dayAbs, 0)} today
          </div>
        </div>
        <div className="iv-kpi">
          <div className="lab">Today</div>
          <div className="val" style={{ color: totals.dayPct >= 0 ? "var(--up)" : "var(--down)" }}>{sign(totals.dayPct)}{totals.dayPct.toFixed(2)}%</div>
          <div className="meta">{rows.length} positions</div>
        </div>
        <div className="iv-kpi">
          <div className="lab">Allocation drift</div>
          <div className="val" style={{ color: needsRebalance(metrics, 5) ? "var(--warn)" : "var(--up)" }}>{metrics.totalDrift.toFixed(1)}<span style={{ fontSize: 14, color: "var(--mute)" }}>pp</span></div>
          <div className="meta">{needsRebalance(metrics, 5) ? "rebalance suggested" : "on target"}</div>
        </div>
        <div className="iv-kpi">
          <div className="lab">Concentration</div>
          <div className="val" style={{ color: metrics.concentrationLabel === "Concentrated" ? "var(--down)" : metrics.concentrationLabel === "Moderate" ? "var(--warn)" : "var(--up)" }}>{metrics.topWeight.toFixed(0)}%</div>
          <div className="meta">{metrics.concentrationLabel}</div>
        </div>
      </div>

      <DailyBrief holdings={rows} metrics={metrics} />

      <div className="iv-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 18 }}>
        <div className="iv-panel" style={{ paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <span className="iv-eyebrow">Performance</span>
            <div className="iv-tabs" style={{ marginLeft: "auto" }}>
              {["1M", "3M", "1Y", "ALL"].map((k) => (
                <button key={k} className={"iv-tab" + (tf === k ? " on" : "")} onClick={() => setTf(k)}>{k}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="pArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3E6B52" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#3E6B52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(39,35,32,.05)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fill: "#6B6358", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<Tip />} cursor={{ stroke: "rgba(39,35,32,.2)" }} />
                <Area type="monotone" dataKey="v" stroke="#3E6B52" strokeWidth={2} fill="url(#pArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "minmax(280px,1fr) 1.6fr" }}>
        <div className="iv-panel">
          <span className="iv-eyebrow">Allocation</span>
          <div style={{ height: 200, marginTop: 10, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={2} stroke="none">
                  {donut.map((d, i) => <Cell key={i} fill={d.tone} />)}
                </Pie>
                <Tooltip content={<Tip prefix="$" />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
              <div style={{ textAlign: "center" }}>
                <div className="iv-mono" style={{ fontWeight: 700, fontSize: 18 }}>{usd(metrics.total, 0)}</div>
                <div className="lab" style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mute)", marginTop: 2 }}>invested</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {donut.map((d) => (
              <span key={d.name} className="iv-mono" style={{ fontSize: 11.5, color: "#6B6358", display: "flex", alignItems: "center", gap: 6 }}>
                <i style={{ width: 8, height: 8, borderRadius: 2, background: d.tone, display: "inline-block" }} />{d.name}
              </span>
            ))}
          </div>
        </div>

        <div className="iv-panel">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <span className="iv-eyebrow">Holdings</span>
            <button className="iv-chip" style={{ marginLeft: "auto", padding: "5px 12px" }} onClick={() => setEditing((e) => !e)}>
              {editing ? "Done" : "Edit"}
            </button>
          </div>
          {editing ? (
            <HoldingEditor holdings={holdings} />
          ) : (
            <table className="iv-tbl" style={{ marginTop: 10 }}>
              <thead><tr><th>Position</th><th className="iv-mob-hide">Shares</th><th>Price</th><th>Value</th><th>Day</th></tr></thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.sym}>
                    <td><div className="iv-sym"><Badge sym={h.sym} tone={h.tone} />
                      <div><div style={{ fontWeight: 600 }}>{h.sym}</div><div className="iv-symname iv-mob-hide">{h.name}</div></div></div></td>
                    <td className="iv-mono iv-mob-hide">{h.sh}</td>
                    <td className="iv-mono">{usd(h.px)}</td>
                    <td className="iv-mono">{usd(h.sh * h.px, 0)}</td>
                    <td style={{ textAlign: "right" }}><ChgTag v={h.chg ?? 0} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RiskTargets metrics={metrics} />
      <ApprovalStrip />
    </div>
  );
}

/* ---------- Daily / weekly market brief (cached per period) ---------- */
function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((+t - +ys) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${wk}`;
}
function DailyBrief({ holdings, metrics }: { holdings: Position[]; metrics: PortfolioMetrics }) {
  const today = new Date();
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const periodKey = mode === "daily" ? "cc_daily_" + today.toISOString().slice(0, 10) : "cc_weekly_" + isoWeek(today);
  const rule = summarizer(holdings, metrics);
  const movers = [...holdings].sort((a, b) => Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0)).slice(0, 3);
  const [ai, setAi] = useState("");
  const [busy, setBusy] = useState(false);
  const [headline, setHeadline] = useState<string>("");

  // load the cached brief; if none yet and a key is connected, write it automatically
  useEffect(() => {
    const cached = localStorage.getItem(periodKey);
    if (cached) { setAi(cached); return; }
    setAi("");
    if (hasKey()) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey]);
  useEffect(() => {
    if (!hasNewsKey()) return;
    let alive = true;
    fetchNews("MKT").then((n) => { if (alive && n[0]) setHeadline(n[0].headline); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  async function generate() {
    if (busy) return;
    if (!hasKey()) { setAi("Add your Anthropic key (top-right) for a written AI market update."); return; }
    setBusy(true);
    try {
      const mv = movers.map((m) => `${m.sym} ${(m.chg ?? 0) >= 0 ? "+" : ""}${(m.chg ?? 0).toFixed(1)}%`).join(", ");
      const span = mode === "daily" ? "daily" : "weekly";
      const txt = await ask(
        `You are a calm, factual market briefer. Write a 3-4 sentence ${span} market update for this investor in plain English: overall direction, their notable movers, drift/concentration posture, and one thing to watch ${mode === "daily" ? "today" : "this week"}. Educational only, never advice.\n` + advisorContext(holdings),
        `${mode === "daily" ? "Date " + today.toDateString() : "Week of " + today.toDateString()}. Movers: ${mv}. Portfolio ${metrics.dayChangePct >= 0 ? "up" : "down"} ${Math.abs(metrics.dayChangePct).toFixed(1)}% today; concentration ${metrics.concentrationLabel}; total drift ${metrics.totalDrift.toFixed(1)}pp.${headline ? " Market headline: " + headline : ""}`,
        340,
      );
      setAi(txt); localStorage.setItem(periodKey, txt);
    } catch (e) { setAi(`Unavailable: ${e instanceof Error ? e.message.slice(0, 60) : "error"}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="iv-panel" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span className="iv-eyebrow">Market Brief</span>
        <div className="iv-tabs" style={{ marginLeft: 4 }}>
          {(["daily", "weekly"] as const).map((m) => (
            <button key={m} className={"iv-tab" + (mode === m ? " on" : "")} style={{ textTransform: "capitalize" }} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
        <span className="iv-mono" style={{ fontSize: 11.5, color: "var(--mute)" }}>
          {mode === "daily" ? today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Week of " + today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span className="iv-tag" style={{ marginLeft: "auto", color: metrics.dayChangePct >= 0 ? "var(--up)" : "var(--down)", borderColor: metrics.dayChangePct >= 0 ? "var(--up)" : "var(--down)" }}>
          <Circle size={8} /> {metrics.dayChangePct >= 0 ? "+" : ""}{metrics.dayChangePct.toFixed(2)}% today
        </span>
      </div>
      <div className="iv-display" style={{ fontSize: 18, marginTop: 10 }}>{rule.summary}</div>
      <p style={{ color: "var(--mute)", fontSize: 13.5, marginTop: 6 }}>{rule.detail}</p>
      {headline && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--mute)" }}>
          <span className="iv-eyebrow" style={{ marginRight: 8 }}>Headline</span>{headline}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {movers.map((m) => (
          <span key={m.sym} className="iv-mono" style={{ fontSize: 12, border: "1px solid var(--line2)", borderRadius: 7, padding: "3px 9px", color: (m.chg ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>
            {m.sym} {(m.chg ?? 0) >= 0 ? "+" : ""}{(m.chg ?? 0).toFixed(1)}%
          </span>
        ))}
      </div>
      {ai && <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 10, padding: 13, fontSize: 13.5, lineHeight: 1.6, background: "var(--frost)" }}>{ai}</div>}
      <button className="iv-cta brassbtn" style={{ width: "auto", margin: "12px 0 0", padding: "8px 16px", fontSize: 12.5 }} disabled={busy} onClick={generate}>
        <Sparkles size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />{busy ? "Writing…" : ai ? `Regenerate ${mode} update` : `Generate AI ${mode} update`}
      </button>
    </div>
  );
}

/* ---------- Steward agent: drift/concentration check -> approvable proposal ---------- */
function runStewardCheck(m: PortfolioMetrics) {
  if (!needsRebalance(m, 5) || !m.maxDrift) {
    propose({
      agent: "Steward",
      title: "Portfolio on target",
      why: `No position drifts more than 5 points from its target. Concentration is ${m.concentrationLabel.toLowerCase()} (top weight ${m.topWeight.toFixed(0)}%). No action needed.`,
      confidence: 0.9,
      kind: "note",
      payload: {},
    });
    return;
  }
  const d = m.maxDrift;
  const trim = d.drift > 0;
  propose({
    agent: "Steward",
    title: `${trim ? "Trim" : "Add to"} ${d.sym} toward its ${d.target}% target`,
    why: `${d.sym} is ${d.weight.toFixed(0)}% of the book vs a ${d.target}% target (${d.drift > 0 ? "+" : ""}${d.drift.toFixed(0)}pp drift). Concentration is ${m.concentrationLabel.toLowerCase()} (top weight ${m.topWeight.toFixed(0)}%). Consider ${trim ? "trimming" : "adding to"} it to move back toward target. Educational only - approving logs this recommendation to your audit trail; it does not place any trade.`,
    confidence: Math.min(0.85, 0.5 + Math.abs(d.drift) / 100),
    kind: "note",
    payload: { sym: d.sym },
  });
}

/* ---------- Allocation vs target + concentration (decision layer) ---------- */
function RiskTargets({ metrics }: { metrics: PortfolioMetrics }) {
  const over = needsRebalance(metrics, 5);
  const concTone = metrics.concentrationLabel === "Concentrated" ? "var(--down)" : metrics.concentrationLabel === "Moderate" ? "var(--warn)" : "var(--up)";
  return (
    <div className="iv-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginTop: 18 }}>
      <div className="iv-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="iv-eyebrow">Allocation vs Target</span>
          <button className="iv-chip" style={{ marginLeft: "auto", padding: "5px 12px" }} onClick={() => runStewardCheck(metrics)}>Run Steward check</button>
          <span className="iv-tag" style={{ color: over ? "var(--warn)" : "var(--up)", borderColor: over ? "rgba(154,107,46,.4)" : "rgba(86,197,150,.4)" }}>
            <Circle size={8} /> {over ? "Rebalance suggested" : "On target"}
          </span>
        </div>
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {metrics.positions.map((p) => {
            const drift = p.drift; const w = Math.min(50, Math.abs(drift)) / 50 * 50; // half-width %
            return (
              <div key={p.sym} style={{ display: "grid", gridTemplateColumns: "56px 1fr 84px", gap: 12, alignItems: "center" }}>
                <span className="iv-mono" style={{ fontSize: 12.5 }}>{p.sym}</span>
                <div style={{ position: "relative", height: 10, borderRadius: 6, background: "var(--line2)" }}>
                  <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "rgba(39,35,32,.25)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 6,
                    [drift >= 0 ? "left" : "right"]: "50%", width: w + "%",
                    background: drift >= 0 ? "linear-gradient(90deg,var(--cyan),#1a86c0)" : "linear-gradient(90deg,#b5454f,var(--down))" } as React.CSSProperties} />
                </div>
                <span className="iv-mono" style={{ fontSize: 12, textAlign: "right", color: Math.abs(drift) >= 5 ? "var(--warn)" : "var(--mute)" }}>
                  {p.weight.toFixed(0)}% / {p.target}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="iv-foot" style={{ marginTop: 14 }}>Bars show drift from your target weight. Set targets in Holdings → Edit. Rebalance is only suggested when any position drifts more than 5 points.</p>
      </div>

      <div className="iv-panel">
        <span className="iv-eyebrow">Concentration</span>
        <div className="iv-display" style={{ fontSize: 40, marginTop: 8, color: concTone }}>{metrics.topWeight.toFixed(0)}%</div>
        <div style={{ color: "var(--mute)", fontSize: 13 }}>largest single position</div>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <Row k="Risk level" v={metrics.concentrationLabel} vc={concTone} />
          <Row k="HHI index" v={metrics.hhi.toFixed(0)} />
          <Row k="Total drift" v={metrics.totalDrift.toFixed(1) + " pp"} />
          {metrics.maxDrift && <Row k="Worst drift" v={`${metrics.maxDrift.sym} ${metrics.maxDrift.drift >= 0 ? "+" : ""}${metrics.maxDrift.drift.toFixed(0)}pp`} />}
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v, vc }: { k: string; v: string; vc?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid var(--line2)", paddingTop: 8 }}>
    <span style={{ color: "var(--mute)" }}>{k}</span>
    <span className="iv-mono" style={{ color: vc || "var(--paper)" }}>{v}</span>
  </div>
);

/* ---------- Editable holdings ---------- */
function HoldingEditor({ holdings }: { holdings: Position[] }) {
  const [sym, setSym] = useState("");
  const targetSum = holdings.reduce((a, h) => a + (h.target ?? 0), 0);
  return (
    <div style={{ marginTop: 10 }}>
      <table className="iv-tbl">
        <thead><tr><th>Position</th><th>Shares</th><th>Price</th><th>Target %</th><th></th></tr></thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.sym}>
              <td style={{ fontWeight: 600 }}>{h.sym}</td>
              <td style={{ textAlign: "right" }}>
                <input className="iv-mono" type="number" defaultValue={h.sh} onChange={(e) => upsertHolding({ ...h, sh: Math.max(0, +e.target.value || 0) })}
                  style={{ width: 64, textAlign: "right", background: "var(--abyss)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--paper)", padding: "5px 8px" }} />
              </td>
              <td style={{ textAlign: "right" }}>
                <input className="iv-mono" type="number" defaultValue={h.px} onChange={(e) => upsertHolding({ ...h, px: Math.max(0, +e.target.value || 0) })}
                  style={{ width: 76, textAlign: "right", background: "var(--abyss)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--paper)", padding: "5px 8px" }} />
              </td>
              <td style={{ textAlign: "right" }}>
                <input className="iv-mono" type="number" defaultValue={h.target ?? 0} onChange={(e) => upsertHolding({ ...h, target: Math.max(0, Math.min(100, +e.target.value || 0)) })}
                  style={{ width: 56, textAlign: "right", background: "var(--abyss)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--paper)", padding: "5px 8px" }} />
              </td>
              <td style={{ textAlign: "right" }}>
                <button className="iv-chip" style={{ padding: "4px 10px", color: "var(--down)" }} onClick={() => removeHolding(h.sym)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input value={sym} onChange={(e) => setSym(e.target.value.toUpperCase())} placeholder="Add ticker (e.g. MSFT)"
          style={{ background: "var(--abyss)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--paper)", padding: "9px 12px", fontFamily: "JetBrains Mono" }} />
        <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "9px 16px" }}
          onClick={() => { if (sym.trim()) { upsertHolding({ sym: sym.trim(), name: sym.trim(), sh: 0, px: 0, tone: "#3E6B52", target: 0 }); setSym(""); } }}>
          Add
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, color: targetSum === 100 ? "var(--up)" : "var(--warn)" }} className="iv-mono">
          targets sum: {targetSum}%
        </span>
        <button className="iv-chip" style={{ padding: "6px 12px" }} onClick={() => resetHoldings()}>Reset</button>
      </div>
    </div>
  );
}

/* ---------- Approval queue + audit (trust) ---------- */
function ApprovalStrip() {
  const pending = usePendingApprovals();
  const audit = useAudit();
  if (!pending.length && !audit.length) return null;
  return (
    <div className="iv-grid" style={{ gridTemplateColumns: pending.length ? "1.3fr 1fr" : "1fr", marginTop: 18 }}>
      {pending.length > 0 && (
        <div className="iv-panel">
          <span className="iv-eyebrow">Pending approvals</span>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {pending.map((a) => (
              <div key={a.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, background: "var(--frost)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{a.title}</span>
                  <span className="iv-tag" style={{ marginLeft: "auto" }}>conf {(a.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={{ color: "var(--mute)", fontSize: 13, margin: "6px 0 10px" }}>{a.why}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "8px 16px" }} onClick={() => approve(a.id)}>Approve</button>
                  <button className="iv-chip" style={{ padding: "8px 16px" }} onClick={() => dismiss(a.id)}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {audit.length > 0 && (
        <div className="iv-panel">
          <span className="iv-eyebrow">Audit trail</span>
          <div style={{ marginTop: 12, display: "grid", gap: 8, maxHeight: 220, overflow: "auto" }}>
            {audit.slice(0, 12).map((e) => (
              <div key={e.id} style={{ fontSize: 12.5, borderTop: "1px solid var(--line2)", paddingTop: 8 }}>
                <span className="iv-mono" style={{ color: "var(--mute)" }}>{new Date(e.ts).toLocaleTimeString().slice(0, 5)}</span>{" "}
                <span style={{ color: "var(--cyan)" }}>{e.actor}</span> {e.action} - <span style={{ color: "var(--mute)" }}>{e.detail}</span>
                {e.undoneAt && <span className="down"> (undone)</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== MARKETS ============================== */
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const d = data.map((v, i) => ({ t: i, v }));
  return (
    <div style={{ width: 92, height: 34 }}>
      <ResponsiveContainer>
        <LineChart data={d}><Line type="monotone" dataKey="v" stroke={up ? "#3E6B52" : "#B0463F"} strokeWidth={1.6} dot={false} /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function Markets() {
  const [cat, setCat] = useState("All");
  const [sortK, setSortK] = useState<"last" | "chg">("chg");
  const [asc, setAsc] = useState(false);
  const { q, status } = useLiveQuotes(SCAN.map((s) => s.sym));
  const qb = quoteBadge(status, "Live · Finnhub");
  const scan = useMemo(() => SCAN.map((s) => ({ ...s, last: q[s.sym]?.last ?? s.last, chg: q[s.sym]?.chg ?? s.chg })), [q]);
  const rows = useMemo(() => {
    let r = cat === "All" ? scan : scan.filter((x) => x.cat === cat);
    r = [...r].sort((a, b) => (a[sortK] < b[sortK] ? -1 : 1) * (asc ? 1 : -1));
    return r;
  }, [cat, sortK, asc, scan]);
  const movers = [...scan].sort((a, b) => b.chg - a.chg);
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
          <div className="iv-hero-sub" style={{ marginTop: 8, gap: 14 }}>
            <span className="iv-mono" style={{ fontSize: 13, color: "var(--up)" }}>{scan.filter((s) => s.chg >= 0).length} advancing</span>
            <span className="iv-mono" style={{ fontSize: 13, color: "var(--down)" }}>{scan.filter((s) => s.chg < 0).length} declining</span>
            <span className="iv-mono" style={{ fontSize: 13, color: "var(--mute)" }}>avg {(scan.reduce((a, s) => a + s.chg, 0) / scan.length).toFixed(2)}%</span>
            <span className="iv-tag" style={qb.c ? { color: qb.c, borderColor: qb.c } : undefined}>
              <Circle size={8} /> {qb.t}
            </span>
          </div>
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
  const { q, status } = useLiveQuotes(["NVDA"]);
  const qb = quoteBadge(status, "Live");
  const px = q["NVDA"]?.last ?? 176.30;
  const chgPct = q["NVDA"]?.chg ?? 2.61;
  const limit = (px * 0.995).toFixed(2);
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
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span className="iv-display" style={{ fontSize: 34 }}>NVDA</span>
              <span className="iv-mono" style={{ fontSize: 20 }}>{usd(px)}</span>
              <ChgTag v={chgPct} big />
              <span className="iv-tag" style={qb.c ? { color: qb.c, borderColor: qb.c } : undefined}>
                <Circle size={8} /> {qb.t}
              </span>
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
                    <stop offset="0%" stopColor="#3E6B52" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#3E6B52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(39,35,32,.05)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis yAxisId="p" tick={{ fill: "#6B6358", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={52} domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(v: number) => "$" + v.toFixed(0)} />
                <YAxis yAxisId="v" hide domain={[0, 4000]} />
                <Tooltip content={<Tip />} cursor={{ stroke: "rgba(39,35,32,.2)" }} />
                <Bar yAxisId="v" dataKey="vol" fill="rgba(39,35,32,.07)" radius={[2, 2, 0, 0]} />
                <Area yAxisId="p" type="monotone" dataKey="v" stroke="#3E6B52" strokeWidth={2} fill="url(#tArea)" />
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
                <div className="iv-input"><span className="iv-mono" style={{ color: "#6B6358" }}>$</span>
                  <input type="text" defaultValue={limit} /></div></div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, color: "#6B6358", fontSize: 13 }}>
              <span>Estimated {side === "buy" ? "cost" : "credit"}</span>
              <span className="iv-mono" style={{ color: "#272320", fontSize: 16 }}>{usd(qty * px)}</span>
            </div>
            <button className={"iv-cta " + side}>{side === "buy" ? "Review buy order" : "Review sell order"}</button>
            <p style={{ fontSize: 11, color: "#6B6358", marginTop: 10, textAlign: "center" }}>Paper trade · demo only, no order is placed.</p>
          </div>

          <div className="iv-panel">
            <span className="iv-eyebrow">Order book</span>
            <div style={{ marginTop: 12 }}>
              {book.map((b, i) => (
                <div className="iv-book-row" key={"a" + i}>
                  <span className="down">{b.px.toFixed(2)}</span><span style={{ color: "#6B6358" }}>{b.sz}</span>
                  <div className="iv-depth" style={{ width: (b.sz / maxSz) * 100 + "%", background: "rgba(255,107,122,.12)" }} />
                </div>
              ))}
              <div className="iv-spread"><span>spread</span><span>{(0.12).toFixed(2)} · 0.07%</span></div>
              {bids.map((b, i) => (
                <div className="iv-book-row" key={"b" + i}>
                  <span className="up">{b.px.toFixed(2)}</span><span style={{ color: "#6B6358" }}>{b.sz}</span>
                  <div className="iv-depth" style={{ width: (b.sz / maxSz) * 100 + "%", background: "rgba(86,197,150,.12)" }} />
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
/* ---------- Agent Ops: role-colored, explainable, approval-gated ---------- */
type AgentRole = "messenger" | "scout" | "steward";
const ROLES: Record<AgentRole, { name: string; color: string; desc: string }> = {
  messenger: { name: "Messenger", color: "#3E6B52", desc: "Plain-language portfolio summary" },
  scout: { name: "Scout", color: "#9A6B2E", desc: "Scans for unusual moves & drawdowns" },
  steward: { name: "Steward", color: "#B0463F", desc: "Drift & concentration risk" },
};
const toneColor: Record<AgentResult["tone"], string> = { good: "var(--up)", warn: "var(--warn)", bad: "var(--down)" };

function AgentOps({ holdings }: { holdings: Position[] }) {
  const metrics = useMemo(() => computeMetrics(holdings), [holdings]);
  const [out, setOut] = useState<Partial<Record<AgentRole, AgentResult>>>({});

  function run(role: AgentRole) {
    const r = role === "messenger" ? summarizer(holdings, metrics) : role === "scout" ? anomalyFlagger(holdings) : stewardReport(metrics);
    setOut((o) => ({ ...o, [role]: r }));
  }
  function send(role: AgentRole, r: AgentResult) {
    if (!r.proposal) return;
    propose({ agent: ROLES[role].name, title: r.proposal.title, why: r.proposal.why, confidence: r.proposal.confidence, kind: "note", payload: r.proposal.payload });
  }

  return (
    <div className="iv-panel" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <span className="iv-eyebrow">Agent Ops</span>
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--mute)" }}>read-only · every action needs your approval</span>
      </div>
      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 12 }}>
        {(Object.keys(ROLES) as AgentRole[]).map((role) => {
          const meta = ROLES[role]; const r = out[role];
          return (
            <div key={role} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, background: "var(--frost)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
                <span style={{ fontWeight: 600, fontFamily: "'Space Mono', monospace", letterSpacing: ".02em" }}>{meta.name}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--mute)", margin: "6px 0 12px" }}>{meta.desc}</div>
              <button className="iv-chip" style={{ padding: "6px 14px" }} onClick={() => run(role)}>Run</button>
              {r && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: toneColor[r.tone] }}>{r.summary}</div>
                  <p style={{ fontSize: 12.5, color: "var(--mute)", margin: "6px 0" }}>{r.detail}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0" }}>
                    {r.evidence.map((e, i) => (
                      <span key={i} className="iv-mono" style={{ fontSize: 10.5, color: "var(--mute)", border: "1px solid var(--line2)", borderRadius: 6, padding: "2px 7px" }}>{e}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="iv-tag" style={{ borderColor: "var(--line)" }}>conf {(r.confidence * 100).toFixed(0)}%</span>
                    {r.proposal && (
                      <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "6px 12px", fontSize: 12 }} onClick={() => send(role, r)}>Send to approvals</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const holdings = useHoldings();
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
      const system = active.systemPrompt + "\n\nThe user's portfolio (reason about these specifics):\n" + advisorContext(holdings);
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
              ? <span className="iv-tag" style={{ color: "var(--up)", borderColor: "rgba(86,197,150,.4)" }}><Circle size={8} /> Live Claude</span>
              : <span className="iv-tag"><Circle size={8} /> Demo · add a key</span>}
          </div>
          <div className="iv-rule" /></div>
      </div>

      <AgentOps holdings={holdings} />
      <div style={{ marginBottom: 18 }}><ApprovalStrip /></div>

      {!connected && (
        <div className="iv-panel" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="iv-badge" style={{ background: "rgba(62,107,82,.14)", color: "var(--cyan)" }}><KeyRound size={16} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600 }}>Connect Claude</div>
              <div style={{ fontSize: 12.5, color: "#6B6358" }}>Paste your Anthropic key (stored only in this browser) to make the council reason live.</div>
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
                <span style={{ fontSize: 11.5, color: "#6B6358" }}>{m.focus}</span>
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
            {busy && <div className="iv-bub ai" style={{ color: "#6B6358" }}>thinking…</div>}
          </div>
          <div className="iv-chatin">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about a holding, risk, dividends…" />
            <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "0 16px", display: "grid", placeItems: "center" }} onClick={send} disabled={busy} aria-label="Send"><Send size={16} /></button>
          </div>
          <p style={{ fontSize: 11, color: "#6B6358", marginTop: 10 }}>Educational only, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}

/* ============================== GOVERNMENT ============================== */
function Government() {
  const [gov, setGov] = useState<GovData | null>(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    fetchGov().then((d) => { setGov(d); setTried(true); }).catch(() => setTried(true));
  }, []);

  // function list (in $B for the bars) + hero total (in $T)
  const fns = gov
    ? gov.functions.map((f) => ({ k: f.name, v: f.amount / 1e9 }))
    : GOV_FUNCTIONS;
  const totalB = fns.reduce((a, f) => a + f.v, 0);
  const maxF = Math.max(...fns.map((f) => f.v));
  const shownT = useCountUp(totalB);
  const live = !!gov;

  return (
    <div className="iv-page">
      <div className="iv-pagehead">
        <div>
          <span className="iv-eyebrow">Federal Spending</span>
          <div className="iv-display iv-hero-num" style={{ fontSize: "clamp(36px,5vw,58px)" }}>${fmt(shownT / 1000, 2)}T</div>
          <div className="iv-hero-sub">
            <span>Total outlays · {gov ? gov.fiscalLabel : "fiscal year"}</span>
            <span className="iv-tag" style={live ? { color: "var(--up)", borderColor: "rgba(86,197,150,.4)" } : undefined}>
              <Circle size={8} /> {live ? "Live · Treasury + USAspending" : tried ? "Sample (live unavailable)" : "Loading…"}
            </span>
          </div>
          <div className="iv-rule" />
        </div>
      </div>

      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>
        <div className="iv-stat"><div className="k">Debt held public</div><div className="v">{gov && gov.debtPublic ? "$" + fmt(gov.debtPublic / 1e12, 1) + "T" : "$28.9T"}</div></div>
        <div className="iv-stat"><div className="k">Total public debt</div><div className="v">{gov && gov.totalDebt ? "$" + fmt(gov.totalDebt / 1e12, 1) + "T" : "$36.2T"}</div></div>
        <div className="iv-stat"><div className="k">Largest function</div><div className="v" style={{ fontSize: 20 }}>{fns[0]?.k ?? "-"}</div></div>
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
              <span key={d.k} className="iv-mono" style={{ fontSize: 11.5, color: "#6B6358", display: "flex", alignItems: "center", gap: 6 }}>
                <i style={{ width: 8, height: 8, borderRadius: 2, background: d.tone, display: "inline-block" }} />{d.k} {d.v}%
              </span>
            ))}
          </div>
        </div>

        <div className="iv-panel">
          <span className="iv-eyebrow">Where it goes · outlays by function</span>
          <div style={{ marginTop: 14 }}>
            {!tried
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <div className="iv-fnrow" key={i}>
                    <Skeleton style={{ height: 13, width: 110 }} />
                    <Skeleton style={{ height: 9, width: "100%" }} />
                    <Skeleton style={{ height: 13, width: 56 }} />
                  </div>
                ))
              : fns.map((f) => (
                  <div className="iv-fnrow" key={f.k}>
                    <span style={{ fontSize: 13.5 }}>{f.k}</span>
                    <div className="iv-track"><div className="iv-fill" style={{ width: (f.v / maxF) * 100 + "%" }} /></div>
                    <span className="iv-mono" style={{ fontSize: 13, color: "#272320", minWidth: 64, textAlign: "right" }}>${fmt(f.v / 1000, 2)}T</span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="iv-panel" style={{ marginTop: 18 }}>
        <span className="iv-eyebrow">Appropriations status · current bill</span>
        <div className="iv-fnrow" style={{ gridTemplateColumns: "200px 1fr auto", marginTop: 12 }}>
          <span style={{ fontSize: 14 }}>Full-year appropriations enacted</span>
          <div className="iv-track"><div className="iv-fill" style={{ width: "72%", background: "linear-gradient(90deg,#3E6B52,#2BB8C4)" }} /></div>
          <span className="iv-mono" style={{ fontSize: 13 }}>9 / 12 bills</span>
        </div>
        <p className="iv-foot">
          {live
            ? "Outlays by function and total are live from "
            : "Live source unavailable right now; showing illustrative sample. Data comes from "}
          <a href="https://api.usaspending.gov" target="_blank" rel="noreferrer">USAspending.gov</a>{" "}
          (spending by budget function), with debt from the U.S. Treasury{" "}
          <a href="https://fiscaldata.treasury.gov/api-documentation" target="_blank" rel="noreferrer">FiscalData API</a>.
          Both are free, public, and require no key. The mandatory/discretionary split is illustrative.
        </p>
      </div>
    </div>
  );
}

/* ============================== SHELL ============================== */
const NAV = [
  { id: "portfolio", label: "Folio", Icon: Wallet, View: Portfolio },
  { id: "markets", label: "Markets", Icon: Radar, View: Markets },
  { id: "news", label: "News", Icon: Newspaper, View: NewsView },
  { id: "opportunities", label: "Scout", Icon: Compass, View: OpportunitiesView },
  { id: "trade", label: "Trade", Icon: Activity, View: Trade },
  { id: "advisor", label: "Advisor", Icon: Sparkles, View: Advisor },
  { id: "town", label: "Town", Icon: MapIcon, View: Town },
  { id: "history", label: "History", Icon: History, View: HistoryView },
  { id: "goals", label: "Goals", Icon: Target, View: GoalsView },
  { id: "academy", label: "Academy", Icon: GraduationCap, View: AcademyView },
  { id: "gov", label: "Gov", Icon: Landmark, View: Government },
];

function Connections({ onClose }: { onClose: () => void }) {
  const [ai, setAi] = useState(getApiKey() || "");
  const [fin, setFin] = useState(getNewsKey() || "");
  function save() {
    if (ai.trim()) setApiKey(ai); else clearApiKey();
    if (fin.trim()) setNewsKey(fin); else clearNewsKey();
    onClose();
  }
  const field = (label: string, hint: string, val: string, set: (s: string) => void, ph: string) => (
    <div className="iv-field">
      <label>{label}</label>
      <div className="iv-input"><input type="password" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} /></div>
      <span style={{ fontSize: 11, color: "var(--mute)" }}>{hint}</span>
    </div>
  );
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 16, background: "rgba(39,35,32,.4)", backdropFilter: "blur(4px)" }}>
      <div className="iv-panel" style={{ width: "min(440px,96vw)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <span className="iv-eyebrow">Connections</span>
          <button className="iv-icon-btn" style={{ marginLeft: "auto" }} onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--mute)", marginBottom: 6 }}>Keys live only in this browser and are sent only to their provider. For a shared deployment, use server keys on Vercel.</p>
        {field("Anthropic (Claude)", "Powers the Advisor council + agent summaries. platform.claude.com", ai, setAi, "sk-ant-…")}
        {field("Finnhub (live quotes)", "Live prices in Folio, Markets, Trade. finnhub.io - free.", fin, setFin, "finnhub key")}
        <button className="iv-cta brassbtn" onClick={save}>Save connections</button>
      </div>
    </div>
  );
}

export default function Observatory() {
  const [active, setActive] = useState("portfolio");
  const View = NAV.find((n) => n.id === active)!.View;
  const [clock, setClock] = useState("");
  const [keys, setKeys] = useState(false);
  const shellMetrics = computeMetrics(useHoldings());
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
            <div className="iv-word iv-mob-hide">OBSERVATORY<span className="dim"> / {NAV.find((n) => n.id === active)?.label}</span></div>
            <div className="iv-srch"><Search size={16} /><input placeholder="Search ticker, fund, or agency…" /></div>
            <div className="iv-pill iv-mob-hide" title="Portfolio value">
              <span className="iv-mono" style={{ color: "var(--paper)" }}>{usd(shellMetrics.total, 0)}</span>
              <span className="iv-mono" style={{ color: shellMetrics.dayChangePct >= 0 ? "var(--up)" : "var(--down)" }}>
                {shellMetrics.dayChangePct >= 0 ? "+" : ""}{shellMetrics.dayChangePct.toFixed(2)}%
              </span>
            </div>
            <div className="iv-pill iv-mob-hide"><Clock size={14} /> <span className="iv-mono">{clock}</span></div>
            <button className="iv-icon-btn" aria-label="Connections" onClick={() => setKeys(true)}><KeyRound size={17} /></button>
          </div>
          <View />
        </div>
      </div>
      {keys && <Connections onClose={() => setKeys(false)} />}
    </div>
  );
}
