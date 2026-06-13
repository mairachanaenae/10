import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { WealthMap } from "@/components/dashboard/WealthMap";
import { GlassCard, SectionHeading } from "@/components/ui/GlassCard";
import { KpiCard, type Kpi } from "@/components/ui/KpiCard";
import { getDisplayName } from "@/lib/auth";
import { getHoldings } from "@/lib/data";
import { summarize } from "@/lib/sample-data";

export default async function DashboardPage() {
  const name = await getDisplayName();
  const holdings = await getHoldings();
  const s = summarize(holdings);

  const invested = holdings.filter((h) => h.assetClass !== "Cash");
  const top = [...invested].sort((a, b) => b.value - a.value)[0];
  const topW = (top.value / s.total) * 100;
  const idxW =
    (invested.filter((h) => h.assetClass === "ETF").reduce((a, h) => a + h.value, 0) / s.total) * 100;
  const insights = [
    `Portfolio is ${s.dayPct >= 0 ? "up" : "down"} <b>${s.dayPct.toFixed(2)}%</b> today. Top mover: <b>${s.best.symbol}</b> +${s.best.dayPct.toFixed(2)}%.`,
    `Biggest position is <b>${top.symbol}</b> at ${topW.toFixed(0)}% of invested assets.`,
    `About ${idxW.toFixed(0)}% sits in broad index ETFs, a diversified core.`,
    `You are ${Math.round((s.netWorth / 100000) * 100)}% of the way to a NOK 100,000 portfolio.`,
  ];

  const kpis: Kpi[] = [
    {
      label: "Net Worth",
      icon: "💎",
      value: s.netWorth,
      decimals: 0,
      prefix: "NOK ",
      tone: "gold",
      sub: `incl. NOK ${s.cash.toLocaleString()} cash`,
    },
    {
      label: "Portfolio",
      icon: "📈",
      value: s.total,
      decimals: 0,
      prefix: "NOK ",
      tone: s.dayPct >= 0 ? "emerald" : "danger",
      sub: `${s.dayPct >= 0 ? "+" : ""}${s.dayPct.toFixed(2)}% today`,
    },
    { label: "Monthly Cash Flow", icon: "💵", value: 1240, decimals: 0, prefix: "NOK ", tone: "emerald", sub: "illustrative" },
    { label: "Freedom Score", icon: "🗽", value: 0, ring: s.freedomScore, tone: "blue", sub: "toward independence" },
    { label: "Growth (YTD)", icon: "🚀", value: 18.4, decimals: 1, suffix: "%", tone: "emerald", sub: "illustrative" },
  ];

  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Command Center</div>
      <h1 className="mb-1 font-display text-3xl font-bold">Welcome back, {name} 👋</h1>
      <p className="mb-5 text-muted">
        Your wealth-building HQ — mentors, agents and your portfolio in one place.
      </p>
      <div className="mb-5 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 py-2.5 text-[11.5px] text-gold">
        Demo mode · sample portfolio. Sign-in (Clerk) + your private holdings (Supabase) and live
        Claude AI connect via env vars — see the deploy runbook.
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <SectionHeading hint="illustrative">Portfolio Performance</SectionHeading>
          <PerformanceChart />
        </GlassCard>
        <GlassCard>
          <SectionHeading hint="hover a node">Wealth Map</SectionHeading>
          <WealthMap holdings={holdings} />
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <SectionHeading hint="auto-generated">Wealth Insights</SectionHeading>
        <ul className="space-y-2.5 text-[13.5px]">
          {insights.map((t, i) => (
            <li key={i} className="flex gap-3 text-muted">
              <span className="text-emerald">◆</span>
              <span dangerouslySetInnerHTML={{ __html: t }} />
            </li>
          ))}
        </ul>
      </GlassCard>
    </>
  );
}
