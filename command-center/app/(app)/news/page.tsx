import { NewsFeed } from "@/components/news/NewsFeed";

export default function NewsPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Market Intelligence</div>
      <h1 className="mb-2 font-display text-3xl font-bold">News</h1>
      <p className="mb-6 max-w-xl text-muted">
        Headlines filtered to your holdings. Tap a story for a live, portfolio-aware take from Claude.
      </p>
      <NewsFeed />
    </>
  );
}
