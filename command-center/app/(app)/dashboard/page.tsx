import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { WealthMap } from "@/components/dashboard/WealthMap";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { GlassCard, SectionHeading } from "@/components/ui/GlassCard";
import { KpiCard, type Kpi } from "@/components/ui/KpiCard";
import { getDisplayName } from "@/lib/auth";
import { getHoldings } from "@/lib/data";
import { historyStats } from "@/lib/history";
import { summarize } from "@/lib/sample-data";

export default async function DashboardPage() {
  const name = await getDisplayName();
  const holdings = await getHoldings();
  const s = summarize(holdings);
  const h = historyStats();
  const monthlyCashFlow = Math.round((h.dividends / 4 + h.deposits) / 3); // avg dividend + contribution per month

  const invested = holdings.filter((h) => h.assetClass !== "Cash");
  const top = [...invested].sort((a, b) => b.value - a.value)[0];
  const topW = (top.value / s.total) * 100;
  const idxW =
    (invested.filter((h) => h.assetClass === "ETF").reduce((a, h) => a + h.value, 0) / s.total) * 100;
  const insights = [
    `Portfolio is ${s.dayPct >= 0 ? "up" : "down"} <b>${s.dayPct.toFixed(2)}%</b> today. Top mover: <b>${s.best.symbol}</b> +${s.best.dayPct.toFixed(2)}%.`,
    `Net worth is <b>+${h.growthPct.toFixed(1)}%</b> over the last 10 months, from NOK ${h.first.toLocaleString()} to NOK ${h.last.toLocaleString()}.`,
    `Biggest position is <b>${top.symbol}</b> at ${topW.toFixed(0)}% of invested assets; about ${idxW.toFixed(0)}% sits in broad index ETFs.`,
    `You have booked <b>NOK ${h.dividends.toFixed(0)}</b> in dividends and are ${Math.round((s.netWorth / 100000) * 100)}% of the way to a NOK 100,000 portfolio.`,
  ];

  const kpis: Kpi[] = [
    {
      label: "Net Worth",
      icon: "networth",
      value: s.netWorth,
      decimals: 0,
      prefix: "NOK ",
      tone: "gold",
      sub: `incl. NOK ${s.cash.toLocaleString()} cash`,
    },
    {
      label: "Portfolio",
      icon: "portfolio",
      value: s.total,
      decimals: 0,
      prefix: "NOK ",
      tone: s.dayPct >= 0 ? "emerald" : "danger",
      sub: `${s.dayPct >= 0 ? "+" : ""}${s.dayPct.toFixed(2)}% today`,
    },
    { label: "Monthly Cash Flow", icon: "cashflow", value: monthlyCashFlow, decimals: 0, prefix: "NOK ", tone: "emerald", sub: "dividends + contributions" },
    { label: "Freedom Score", icon: "freedom", value: 0, ring: s.freedomScore, tone: "blue", sub: "toward independence" },
    { label: "Growth (10mo)", icon: "growth", value: h.growthPct, decimals: 1, suffix: "%", tone: "emerald", sub: "real net-worth trajectory" },
  ];

  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Command Center</div>
      <h1 className="mb-1 font-display text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
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
        <GlassCard className="sheen">
          <SectionHeading hint="net-worth trajectory">Portfolio Performance</SectionHeading>
          <PerformanceChart />
        </GlassCard>
        <GlassCard className="sheen">
          <SectionHeading hint="hover a node">Wealth Map</SectionHeading>
          <WealthMap holdings={holdings} />
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard className="sheen">
          <SectionHeading hint="auto-generated">Wealth Insights</SectionHeading>
          <ul className="space-y-2.5 text-[13.5px]">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-3 text-muted">
                <span className="mt-[3px] text-blue">◆</span>
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="sheen">
          <SectionHeading hint="last few moves">Recent Activity</SectionHeading>
          <RecentActivity />
        </GlassCard>
      </div>
    </>
  );
}
