import { FinancialHistory } from "@/components/history/FinancialHistory";

export default function HistoryPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Track Record</div>
      <h1 className="mb-2 font-display text-3xl font-bold">Financial History</h1>
      <p className="mb-6 max-w-xl text-muted">
        Your net worth, dividend income, and every transaction over time — the receipts behind the score.
      </p>
      <FinancialHistory />
    </>
  );
}
