import { MarketHistory } from "@/components/history/MarketHistory";

export default function HistoryPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Lessons from the past</div>
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Financial History</h1>
      <p className="mb-6 max-w-2xl text-muted">
        The market&apos;s biggest crashes and what they teach about today. Every era ended the same way —
        with a recovery — but the lessons about leverage, valuation, and panic still apply to your money now.
      </p>
      <MarketHistory />
    </>
  );
}
