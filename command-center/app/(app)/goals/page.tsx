import { GlassCard } from "@/components/ui/GlassCard";
import { getGoals } from "@/lib/data";
import { money } from "@/lib/utils";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Wealth Goals</div>
      <h1 className="mb-6 font-display text-3xl font-bold">Your Roadmap</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((g) => {
          const pc = Math.min(100, Math.round((g.current / g.target) * 100));
          const cur = g.unit === "score" ? `${g.current} / ${g.target}` : money(g.current, "NOK", 0);
          const tgt = g.unit === "score" ? "score" : `of ${money(g.target, "NOK", 0)}`;
          return (
            <GlassCard key={g.id}>
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2.5 font-display text-[15px] font-semibold">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-line2 bg-blue/[0.12] text-blue">
                    <g.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  {g.title}
                </div>
                <div className="font-display text-lg font-bold text-emerald">{pc}%</div>
              </div>
              <div className="my-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-emerald"
                  style={{ width: `${pc}%` }}
                />
              </div>
              <div className="text-[12.5px] text-muted">
                {cur} {tgt} · forecast {g.forecast}
              </div>
            </GlassCard>
          );
        })}
      </div>
      <p className="mt-6 text-[11px] text-faint">
        Targets are editable in Settings once Supabase is connected. Educational only, not financial advice.
      </p>
    </>
  );
}
