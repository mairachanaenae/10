import { GlassCard } from "./GlassCard";

export function Placeholder({
  eyebrow,
  title,
  blurb,
  milestone,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  milestone: string;
}) {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">{eyebrow}</div>
      <h1 className="mb-1 font-display text-3xl font-bold">{title}</h1>
      <p className="mb-6 max-w-xl text-muted">{blurb}</p>
      <GlassCard className="grid h-[280px] place-items-center text-center">
        <div>
          <div className="font-display text-lg">Arriving in {milestone}</div>
          <p className="mt-2 text-sm text-faint">
            The shell, design system, and data/AI libraries are in place — this surface is built next.
          </p>
        </div>
      </GlassCard>
    </>
  );
}
