import { Radar } from "@/components/opportunities/Radar";
import { GlassCard, SectionHeading } from "@/components/ui/GlassCard";

export default function OpportunitiesPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Opportunity Radar</div>
      <h1 className="mb-6 font-display text-3xl font-bold">Market Scan</h1>
      <GlassCard>
        <SectionHeading hint="illustrative signals">Radar</SectionHeading>
        <Radar />
      </GlassCard>
    </>
  );
}
