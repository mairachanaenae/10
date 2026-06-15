"use client";

// The previously-built surfaces, rebuilt as HUD workspaces over the existing
// data libs: News, Market History, Goals, Academy, Opportunities.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, TrendingDown, TrendingUp, Minus, GraduationCap, ExternalLink } from "lucide-react";
import { NEWS, NEWS_SYMBOLS, type NewsItem, type NewsTone } from "@/lib/news";
import { fetchNews, hasNewsKey } from "@/lib/news-api";
import { MARKET_EVENTS } from "@/lib/market-history";
import { SAMPLE_GOALS } from "@/lib/sample-data";
import { ask, hasKey } from "@/lib/browser-ai";
import { useHoldings, type Position } from "@/lib/holdings-store";

const tip = { background: "#FCFAF4", border: "1px solid rgba(39,35,32,.14)", borderRadius: 11, fontSize: 12, color: "#272320" };

function ctx(holdings: Position[]): string {
  const v = holdings.reduce((a, h) => a + h.sh * h.px, 0) || 1;
  return `User portfolio ~$${Math.round(v).toLocaleString()}: ` + holdings.map((h) => `${h.sym} ${((h.sh * h.px) / v * 100).toFixed(0)}%`).join(", ") + ". Educational only, not advice.";
}
const Head = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => (
  <div className="iv-pagehead">
    <div>
      <span className="iv-eyebrow">{eyebrow}</span>
      <div className="iv-display" style={{ fontSize: 40, marginTop: 6 }}>{title}</div>
      {sub && <div className="iv-hero-sub" style={{ marginTop: 8 }}><span style={{ color: "var(--mute)", fontSize: 13 }}>{sub}</span></div>}
      <div className="iv-rule" />
    </div>
  </div>
);

/* ============================== NEWS ============================== */
const toneMeta: Record<NewsTone, { c: string; label: string; Icon: typeof TrendingUp }> = {
  bull: { c: "var(--up)", label: "bullish", Icon: TrendingUp },
  bear: { c: "var(--down)", label: "bearish", Icon: TrendingDown },
  neutral: { c: "var(--mute)", label: "neutral", Icon: Minus },
};
export function NewsView() {
  const holdings = useHoldings();
  const [filter, setFilter] = useState("All");
  const [feed, setFeed] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveNews, setLiveNews] = useState(false);
  const [live, setLive] = useState(false);
  const [takes, setTakes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => { setLive(hasKey()); setLiveNews(hasNewsKey()); }, []);
  const sample = useMemo(() => (filter === "All" ? NEWS : NEWS.filter((n) => n.symbol === filter)), [filter]);

  const load = useCallback(async (sym: string) => {
    if (!hasNewsKey()) { setFeed(null); return; }
    setLoading(true);
    try { const d = await fetchNews(sym); setFeed(d.length ? d : null); } catch { setFeed(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(filter); }, [filter, load]);
  const items = feed ?? sample;

  async function summarize(n: NewsItem) {
    if (busy[n.id]) return;
    if (!hasKey()) { setTakes((t) => ({ ...t, [n.id]: "Add your Anthropic key (top-right) for a live, portfolio-aware take." })); return; }
    setBusy((b) => ({ ...b, [n.id]: true }));
    try {
      const r = await ask("You are a markets analyst. In 2 short sentences explain what this headline means for the user's portfolio and one thing to watch.\n" + ctx(holdings), `${n.headline}. ${n.summary}`, 200);
      setTakes((t) => ({ ...t, [n.id]: r || "No summary." }));
    } catch (e) { setTakes((t) => ({ ...t, [n.id]: `Unavailable: ${e instanceof Error ? e.message.slice(0, 60) : "error"}` })); }
    finally { setBusy((b) => ({ ...b, [n.id]: false })); }
  }

  return (
    <div className="iv-page">
      <Head eyebrow="Market Intelligence" title="News" sub="Headlines filtered to your holdings, with a live AI take on each." />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
        {NEWS_SYMBOLS.map((s) => <button key={s} className={"iv-chip" + (filter === s ? " on" : "")} onClick={() => setFilter(s)}>{s}</button>)}
        <span className="iv-tag" style={{ marginLeft: "auto", color: liveNews ? "var(--up)" : undefined, borderColor: liveNews ? "var(--up)" : undefined }}>{liveNews ? "Live · Finnhub" : "Sample headlines"}</span>
      </div>
      <div className="iv-grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
        {loading ? [0, 1, 2].map((i) => <div key={i} className="iv-panel" style={{ height: 120, opacity: 0.5 }} />) :
          items.map((n) => {
            const tm = toneMeta[n.tone];
            return (
              <div key={n.id} className="iv-panel">
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--mute)" }}>
                  <span className="iv-mono" style={{ color: "var(--cyan)", border: "1px solid var(--line)", borderRadius: 6, padding: "1px 6px" }}>{n.symbol}</span>
                  <span>{n.source}</span><span>·</span><span className="iv-mono">{n.time}</span>
                  <span className="iv-tag" style={{ marginLeft: "auto", color: tm.c, borderColor: tm.c }}><tm.Icon size={11} /> {tm.label}</span>
                </div>
                {n.url
                  ? <a href={n.url} target="_blank" rel="noreferrer" className="iv-display" style={{ display: "block", fontSize: 17, marginTop: 8, color: "var(--paper)" }}>{n.headline} <ExternalLink size={13} style={{ opacity: 0.6 }} /></a>
                  : <div className="iv-display" style={{ fontSize: 17, marginTop: 8 }}>{n.headline}</div>}
                <p style={{ color: "var(--mute)", fontSize: 13.5, marginTop: 6 }}>{n.summary}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 10 }}>
                  {n.tags.map((t) => <span key={t} style={{ fontSize: 11, color: "var(--mute)", border: "1px solid var(--line2)", borderRadius: 6, padding: "2px 8px" }}>{t}</span>)}
                  <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "6px 14px", fontSize: 12.5, marginLeft: "auto" }} disabled={busy[n.id]} onClick={() => summarize(n)}>
                    <Sparkles size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />{busy[n.id] ? "Reading…" : "What this means for me"}
                  </button>
                </div>
                {takes[n.id] && <div style={{ marginTop: 10, border: "1px solid var(--line)", borderRadius: 10, padding: 12, fontSize: 13, background: "var(--frost)" }}>{takes[n.id]}</div>}
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ============================== MARKET HISTORY ============================== */
export function HistoryView() {
  const holdings = useHoldings();
  const [live, setLive] = useState(false);
  const [takes, setTakes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  useEffect(() => setLive(hasKey()), []);
  const chart = MARKET_EVENTS.map((e) => ({ year: e.year.split("-")[0], drawdown: e.drawdown, name: e.name }));

  async function stress(e: typeof MARKET_EVENTS[number]) {
    if (busy[e.id]) return;
    if (!hasKey()) { setTakes((t) => ({ ...t, [e.id]: "Add your Anthropic key (top-right) to stress-test your holdings against this event." })); return; }
    setBusy((b) => ({ ...b, [e.id]: true }));
    try {
      const r = await ask("You are a risk analyst. In 3 short sentences, estimate how a repeat of this event would hit the user's specific holdings and one defensive action.\n" + ctx(holdings), `${e.name} (${e.year}): ${e.what} Drawdown ~${e.drawdown}%.`, 240);
      setTakes((t) => ({ ...t, [e.id]: r || "No analysis." }));
    } catch (err) { setTakes((t) => ({ ...t, [e.id]: `Unavailable: ${err instanceof Error ? err.message.slice(0, 60) : "error"}` })); }
    finally { setBusy((b) => ({ ...b, [e.id]: false })); }
  }

  return (
    <div className="iv-page">
      <Head eyebrow="Lessons from the past" title="Financial History" sub="The market's biggest crashes and what they teach about today." />
      <div className="iv-panel" style={{ marginBottom: 18 }}>
        <span className="iv-eyebrow">Major drawdowns through history</span>
        <div style={{ height: 200, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={chart} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fill: "#7E8BA6", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7E8BA6", fontSize: 11 }} axisLine={false} tickLine={false} width={34} unit="%" />
              <Tooltip contentStyle={tip} cursor={{ fill: "rgba(39,35,32,.04)" }} formatter={(v: number) => [`-${v}%`, "drawdown"]} />
              <Bar dataKey="drawdown" radius={[5, 5, 0, 0]}>
                {chart.map((d, i) => <Cell key={i} fill={d.drawdown >= 60 ? "#B0463F" : d.drawdown >= 40 ? "#9A6B2E" : "#3E6B52"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="iv-grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
        {MARKET_EVENTS.map((e) => (
          <div key={e.id} className="iv-panel">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span className="iv-mono" style={{ color: "var(--cyan)" }}>{e.year}</span>
              <span className="iv-display" style={{ fontSize: 18 }}>{e.name}</span>
              <span className="iv-tag" style={{ marginLeft: "auto", color: "var(--down)", borderColor: "var(--down)" }}>−{e.drawdown}%</span>
            </div>
            <p style={{ color: "var(--mute)", fontSize: 13.5, marginTop: 8 }}>{e.what}</p>
            <div style={{ marginTop: 10, border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "var(--frost)" }}>
              <div className="iv-eyebrow">What it means today</div>
              <p style={{ fontSize: 13.5, marginTop: 4 }}>{e.lessonToday}</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>Recovery: <span className="iv-mono" style={{ color: "var(--paper)" }}>{e.recovery}</span></span>
              <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "6px 14px", fontSize: 12.5, marginLeft: "auto" }} disabled={busy[e.id]} onClick={() => stress(e)}>
                <Sparkles size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />{busy[e.id] ? "Analyzing…" : "How would this hit my portfolio?"}
              </button>
            </div>
            {takes[e.id] && <div style={{ marginTop: 10, border: "1px solid var(--line)", borderRadius: 10, padding: 12, fontSize: 13, background: "var(--frost)" }}>{takes[e.id]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== GOALS ============================== */
export function GoalsView() {
  return (
    <div className="iv-page">
      <Head eyebrow="Wealth Goals" title="Roadmap" sub="Progress toward the milestones that matter." />
      {(() => {
        const avg = Math.round(SAMPLE_GOALS.reduce((a, g) => a + Math.min(100, (g.current / g.target) * 100), 0) / SAMPLE_GOALS.length);
        return (
          <div className="iv-kpi feature" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div className="lab">Overall progress</div>
              <div className="val" style={{ color: "var(--cyan)" }}>{avg}%</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="iv-track" style={{ height: 10 }}><div className="iv-fill" style={{ width: avg + "%" }} /></div>
              <div className="meta" style={{ marginTop: 8 }}>{SAMPLE_GOALS.length} active goals - keep contributing to move every bar right.</div>
            </div>
          </div>
        );
      })()}
      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        {SAMPLE_GOALS.map((g) => {
          const pc = Math.min(100, Math.round((g.current / g.target) * 100));
          const cur = g.unit === "score" ? `${g.current} / ${g.target}` : "$" + g.current.toLocaleString();
          return (
            <div key={g.id} className="iv-panel">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="iv-badge" style={{ background: "rgba(154,107,46,.14)", color: "var(--gold)", border: "1px solid rgba(154,107,46,.3)" }}><g.icon size={18} /></span>
                <div style={{ fontWeight: 600, fontFamily: "'Space Mono', monospace", fontSize: 17 }}>{g.title}</div>
                <span className="iv-display" style={{ marginLeft: "auto", fontSize: 24, color: "var(--cyan)" }}>{pc}%</span>
              </div>
              <div className="iv-track" style={{ marginTop: 14, height: 10 }}><div className="iv-fill" style={{ width: pc + "%" }} /></div>
              <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--mute)" }}>{cur}{g.unit !== "score" && ` of $${g.target.toLocaleString()}`} · forecast {g.forecast}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== ACADEMY ============================== */
const TOPICS = [
  { t: "Stocks 101", d: "What a share is and how to value one" },
  { t: "ETFs & Index Funds", d: "Owning the whole market cheaply" },
  { t: "Dividends & Compounding", d: "Income that grows over time" },
  { t: "Value Investing", d: "Margin of safety, price vs value" },
  { t: "Risk & Position Sizing", d: "Not letting one bet sink you" },
  { t: "Macro & Rates", d: "How cycles move markets" },
];
export function AcademyView() {
  const holdings = useHoldings();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);
  async function tutor(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true); setA("");
    if (!hasKey()) { setA("Add your Anthropic key (top-right) to ask the AI tutor live."); setBusy(false); return; }
    try { setA(await ask("You are a friendly investing tutor. Explain in plain, beginner English, 3-4 sentences. " + ctx(holdings), question, 320)); }
    catch (e) { setA(`Unavailable: ${e instanceof Error ? e.message.slice(0, 60) : "error"}`); } finally { setBusy(false); }
  }
  return (
    <div className="iv-page">
      <Head eyebrow="Learning Center" title="Academy" sub="Bite-size lessons with an AI tutor grounded in your portfolio." />
      <div className="iv-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="iv-badge" style={{ background: "rgba(62,107,82,.14)", color: "var(--cyan)" }}><GraduationCap size={18} /></span>
          <div style={{ fontWeight: 600 }}>AI Tutor</div>
        </div>
        <div className="iv-chatin" style={{ marginTop: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tutor(q)} placeholder="Ask any concept… e.g. what is a dividend yield?"
            style={{ flex: 1, background: "var(--abyss)", border: "1px solid var(--line)", borderRadius: 11, color: "var(--paper)", padding: "11px 13px", outline: 0 }} />
          <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "0 18px" }} disabled={busy} onClick={() => tutor(q)}>{busy ? "…" : "Ask"}</button>
        </div>
        {a && <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 10, padding: 14, fontSize: 13.5, lineHeight: 1.6 }}>{a}</div>}
      </div>
      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        {TOPICS.map((x) => (
          <button key={x.t} className="iv-panel" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => { setQ(x.t); tutor("Explain: " + x.t + " - " + x.d); }}>
            <div style={{ fontWeight: 600, fontFamily: "'Space Mono', monospace", fontSize: 16 }}>{x.t}</div>
            <div style={{ fontSize: 12.5, color: "var(--mute)", marginTop: 4 }}>{x.d}</div>
            <div style={{ fontSize: 12, color: "var(--cyan)", marginTop: 10 }}>Ask the tutor →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================== OPPORTUNITIES ============================== */
const OPPS = [
  { sym: "Broad ex-US index", kind: "Diversifier", risk: 2, ret: 3, why: "Your book is US-heavy; international index exposure broadens it cheaply." },
  { sym: "Short-term treasuries", kind: "Ballast", risk: 1, ret: 2, why: "A cash-like sleeve cushions drawdowns and funds future buys." },
  { sym: "Dividend-growth ETF", kind: "Income", risk: 2, ret: 3, why: "Rising-dividend basket complements your single-name dividend payers." },
  { sym: "Healthcare sector", kind: "Defensive", risk: 2, ret: 3, why: "Adds a defensive, less rate-sensitive growth leg." },
  { sym: "AI infrastructure", kind: "Growth", risk: 4, ret: 5, why: "Higher-beta growth; size small given NVDA concentration already." },
];
export function OpportunitiesView() {
  const riskColor = (r: number) => (r >= 4 ? "var(--down)" : r >= 3 ? "var(--gold)" : "var(--up)");
  return (
    <div className="iv-page">
      <Head eyebrow="Opportunity Radar" title="Opportunities" sub="Ideas that would diversify or strengthen your book - categories, not hot tips." />
      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {OPPS.map((o) => (
          <div key={o.sym} className="iv-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontFamily: "'Space Mono', monospace", fontSize: 17 }}>{o.sym}</span>
              <span className="iv-tag" style={{ marginLeft: "auto" }}>{o.kind}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--mute)", margin: "8px 0 12px" }}>{o.why}</p>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Risk", o.risk, riskColor(o.risk)], ["Return", o.ret, "var(--cyan)"]].map(([label, val, col]) => (
                <div key={label as string} style={{ flex: 1 }}>
                  <div className="iv-eyebrow" style={{ fontSize: 9 }}>{label as string}</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                    {[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= (val as number) ? (col as string) : "var(--line2)" }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="iv-foot">Illustrative, educational only - not financial advice or a recommendation to buy.</p>
    </div>
  );
}
