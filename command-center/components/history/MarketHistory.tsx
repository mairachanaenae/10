"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, TrendingDown } from "lucide-react";
import { MARKET_EVENTS, type MarketEvent } from "@/lib/market-history";
import { ask, hasKey } from "@/lib/browser-ai";
import { portfolioContext } from "@/lib/portfolio-context";

const tip = {
  background: "#0e1320",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  fontSize: 12,
};

export function MarketHistory() {
  const [live, setLive] = useState(false);
  const [takes, setTakes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => setLive(hasKey()), []);

  const chartData = MARKET_EVENTS.map((e) => ({ year: e.year.split("–")[0], drawdown: e.drawdown, name: e.name }));

  async function stressTest(e: MarketEvent) {
    if (busy[e.id]) return;
    if (!hasKey()) {
      setTakes((t) => ({
        ...t,
        [e.id]: "Add your Anthropic key in Settings to run a live stress-test of your holdings against this event.",
      }));
      return;
    }
    setBusy((b) => ({ ...b, [e.id]: true }));
    try {
      const system =
        "You are a risk analyst. In 3 short sentences, estimate how a repeat of the described historical " +
        "event would likely affect THIS specific portfolio (which holdings are most/least exposed and why), " +
        "and one defensive action to consider. Plain English, educational only, never financial advice.\n\n" +
        "Portfolio:\n" + portfolioContext();
      const user = `Event: ${e.name} (${e.year}). What happened: ${e.what} Approx index drawdown: ${e.drawdown}%.`;
      const reply = await ask(system, user, 240);
      setTakes((t) => ({ ...t, [e.id]: reply || "No analysis returned." }));
    } catch (err) {
      setTakes((t) => ({ ...t, [e.id]: `Live analysis unavailable: ${err instanceof Error ? err.message.slice(0, 80) : "error"}` }));
    } finally {
      setBusy((b) => ({ ...b, [e.id]: false }));
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass sheen p-5">
        <div className="mb-1 font-display text-[13px] font-semibold">Major drawdowns through history</div>
        <p className="mb-3 text-[12px] text-muted">Approx peak-to-trough decline of the broad index in each crisis.</p>
        <div className="h-[200px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5e6b86", fontSize: 11 }} axisLine={false} tickLine={false} width={34} unit="%" />
              <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,.04)" }} formatter={(v: number) => [`-${v}%`, "drawdown"]} labelFormatter={(l, p) => (p?.[0]?.payload?.name ?? l)} />
              <Bar dataKey="drawdown" radius={[5, 5, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.drawdown >= 60 ? "#fb7185" : d.drawdown >= 40 ? "#e9c46a" : "#6ea8fe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
            (live ? "border-emerald text-emerald" : "border-line text-faint")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (live ? "bg-emerald animate-pulse-dot" : "bg-faint")} />
          {live ? "live stress-tests enabled" : "stress-tests: add a Claude key in Settings"}
        </span>
      </div>

      <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-line2">
        {MARKET_EVENTS.map((e) => (
          <div key={e.id} className="relative pl-10">
            <span className="absolute left-[7px] top-5 grid h-[18px] w-[18px] place-items-center rounded-full border border-danger/60 bg-bg text-danger">
              <TrendingDown className="h-3 w-3" strokeWidth={2} />
            </span>
            <article className="glass sheen p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12px] text-blue">{e.year}</span>
                <h3 className="font-display text-[16px] font-semibold">{e.name}</h3>
                <span className="ml-auto rounded-full border border-danger/50 px-2.5 py-0.5 text-[12px] tnum text-danger">
                  −{e.drawdown}%
                </span>
              </div>
              <p className="mt-2 text-[13.5px] text-muted">{e.what}</p>
              <div className="mt-3 rounded-xl border border-line bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-faint">What it means today</div>
                <p className="mt-1 text-[13.5px] text-ink">{e.lessonToday}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-muted">Recovery: <span className="tnum text-ink">{e.recovery}</span></span>
                {e.tags.map((t) => (
                  <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted">{t}</span>
                ))}
                <button
                  onClick={() => stressTest(e)}
                  disabled={busy[e.id]}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-blue/[0.14] px-3 py-1.5 font-display text-[12.5px] font-semibold text-blue disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {busy[e.id] ? "Analyzing…" : "How would this hit my portfolio?"}
                </button>
              </div>
              {takes[e.id] && (
                <div className="mt-3 rounded-xl border border-line bg-white/[0.03] p-3 text-[13px] text-ink">
                  <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-faint">Stress-test</div>
                  {takes[e.id]}
                </div>
              )}
            </article>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-faint">Historical figures are approximate and illustrative. Educational only — not financial advice.</p>
    </div>
  );
}
