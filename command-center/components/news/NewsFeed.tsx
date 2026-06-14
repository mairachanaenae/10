"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { NEWS, NEWS_SYMBOLS, type NewsItem, type NewsTone } from "@/lib/news";
import { ask, hasKey } from "@/lib/browser-ai";
import { fetchNews, hasNewsKey } from "@/lib/news-api";
import { portfolioContext } from "@/lib/portfolio-context";

const toneStyles: Record<NewsTone, { cls: string; label: string; Icon: typeof TrendingUp }> = {
  bull: { cls: "border-emerald/60 text-emerald", label: "bullish", Icon: TrendingUp },
  bear: { cls: "border-danger/60 text-danger", label: "bearish", Icon: TrendingDown },
  neutral: { cls: "border-line2 text-muted", label: "neutral", Icon: Minus },
};

export function NewsFeed() {
  const [filter, setFilter] = useState<string>("All");
  const [live, setLive] = useState(false);
  const [liveNews, setLiveNews] = useState(false);
  const [feed, setFeed] = useState<NewsItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedNote, setFeedNote] = useState("");
  const [takes, setTakes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLive(hasKey());
    setLiveNews(hasNewsKey());
  }, []);

  const sample = useMemo(
    () => (filter === "All" ? NEWS : NEWS.filter((n) => n.symbol === filter)),
    [filter],
  );

  // Try the browser-direct Finnhub key first; otherwise probe the Vercel /api/news
  // server route (present only on the deployed app — 404s silently on Pages → sample).
  const loadLive = useCallback(async (sym: string) => {
    setLoading(true);
    setFeedNote("");
    try {
      let data;
      if (hasNewsKey()) {
        data = await fetchNews(sym);
      } else {
        const res = await fetch(`/api/news?symbol=${encodeURIComponent(sym)}`);
        if (!res.ok) throw new Error(`server ${res.status}`);
        const json = await res.json();
        data = Array.isArray(json.items) ? json.items : [];
        if (!data.length) throw new Error(json.error || "no items");
        setLiveNews(true);
      }
      setFeed(data.length ? data : NEWS.filter((n) => sym === "All" || n.symbol === sym));
      if (!data.length) setFeedNote("No live stories for this filter — showing sample.");
    } catch {
      setFeed(null); // silent fall back to curated sample
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLive(filter);
  }, [filter, loadLive]);

  const items = feed ?? sample;

  async function summarize(n: NewsItem) {
    if (busy[n.id]) return;
    if (!hasKey()) {
      setTakes((t) => ({
        ...t,
        [n.id]: "Add your Anthropic key in Settings to get a live, portfolio-aware take on this story.",
      }));
      return;
    }
    setBusy((b) => ({ ...b, [n.id]: true }));
    try {
      const system =
        "You are a markets analyst on a personal investment dashboard. In 2 short sentences, explain " +
        "what this headline means for THIS user's portfolio specifically, and one thing to watch. " +
        "Plain English, educational only, never financial advice.\n\nPortfolio:\n" + portfolioContext();
      const reply = await ask(system, `Headline: ${n.headline}\nContext: ${n.summary}`, 200);
      setTakes((t) => ({ ...t, [n.id]: reply || "No summary returned." }));
    } catch (e) {
      setTakes((t) => ({ ...t, [n.id]: `Live take unavailable: ${e instanceof Error ? e.message.slice(0, 80) : "error"}` }));
    } finally {
      setBusy((b) => ({ ...b, [n.id]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {NEWS_SYMBOLS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              "rounded-full border px-3 py-1 text-[12px] tnum transition " +
              (filter === s ? "border-blue bg-blue/[0.14] text-ink" : "border-line text-muted hover:text-ink")
            }
          >
            {s}
          </button>
        ))}
        <span
          className={
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] " +
            (liveNews ? "border-blue text-blue" : "border-line text-faint")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (liveNews ? "bg-blue animate-pulse-dot" : "bg-faint")} />
          {liveNews ? "live headlines" : "sample headlines"}
        </span>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] " +
            (live ? "border-emerald text-emerald" : "border-line text-faint")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (live ? "bg-emerald animate-pulse-dot" : "bg-faint")} />
          {live ? "AI summaries live" : "AI summaries: add key"}
        </span>
      </div>

      {feedNote && <p className="text-[12px] text-faint">{feedNote}</p>}

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass animate-pulse p-5">
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
              <div className="mt-3 h-4 w-3/4 rounded bg-white/[0.08]" />
              <div className="mt-2 h-3 w-full rounded bg-white/[0.05]" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid gap-3">
        {items.map((n) => {
          const tone = toneStyles[n.tone];
          return (
            <article key={n.id} className="glass p-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <span className="rounded-md border border-line2 bg-white/[0.04] px-1.5 py-0.5 font-mono text-blue">{n.symbol}</span>
                <span>{n.source}</span>
                <span>·</span>
                <span className="tnum">{n.time}</span>
                <span className={"ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 " + tone.cls}>
                  <tone.Icon className="h-3 w-3" /> {tone.label}
                </span>
              </div>
              {n.url ? (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-2 block font-display text-[15.5px] font-semibold leading-snug hover:text-blue">
                  {n.headline}
                </a>
              ) : (
                <h3 className="mt-2 font-display text-[15.5px] font-semibold leading-snug">{n.headline}</h3>
              )}
              <p className="mt-1.5 text-[13.5px] text-muted">{n.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {n.tags.map((t) => (
                  <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted">{t}</span>
                ))}
                <button
                  onClick={() => summarize(n)}
                  disabled={busy[n.id]}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-blue/[0.14] px-3 py-1.5 font-display text-[12.5px] font-semibold text-blue disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {busy[n.id] ? "Reading…" : "What this means for me"}
                </button>
              </div>
              {takes[n.id] && (
                <div className="mt-3 rounded-xl border border-line bg-white/[0.03] p-3 text-[13px] text-ink">
                  <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-faint">AI take</div>
                  {takes[n.id]}
                </div>
              )}
            </article>
          );
        })}
      </div>
      )}
    </div>
  );
}
