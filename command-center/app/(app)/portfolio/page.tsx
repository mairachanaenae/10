import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { GlassCard, SectionHeading } from "@/components/ui/GlassCard";
import { getHoldings } from "@/lib/data";
import { summarize } from "@/lib/sample-data";
import { money } from "@/lib/utils";

export default async function PortfolioPage() {
  const holdings = await getHoldings();
  const invested = holdings.filter((h) => h.assetClass !== "Cash");
  const s = summarize(holdings);

  const snap: [string, string][] = [
    ["Total value", money(s.total, "NOK", 0)],
    ["Today", `${s.dayPct >= 0 ? "+" : ""}${s.dayPct.toFixed(2)}%`],
    ["Holdings", String(invested.length)],
    ["Best today", `${s.best.symbol} +${s.best.dayPct.toFixed(2)}%`],
  ];

  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Portfolio</div>
      <h1 className="mb-6 font-display text-3xl font-bold">Holdings</h1>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <SectionHeading>Allocation</SectionHeading>
          <AllocationDonut holdings={invested} />
        </GlassCard>
        <GlassCard>
          <SectionHeading>Snapshot</SectionHeading>
          <div className="grid grid-cols-2 gap-5">
            {snap.map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{k}</div>
                <div className="mt-1 font-display text-xl font-semibold tnum">{v}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <SectionHeading hint="sortable · click a stock for the council">Holdings</SectionHeading>
        <HoldingsTable holdings={holdings} />
      </GlassCard>
    </>
  );
}
