import { GraduationCap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const TOPICS: { t: string; d: string; progress: number }[] = [
  { t: "Stocks 101", d: "What a share is and how to value one", progress: 30 },
  { t: "ETFs & Index Funds", d: "Owning the whole market cheaply", progress: 65 },
  { t: "Dividends & Compounding", d: "Income that grows over time", progress: 80 },
  { t: "Value Investing", d: "Margin of safety, price vs value", progress: 20 },
  { t: "Growth Investing", d: "Backing durable trends", progress: 45 },
  { t: "Risk & Position Sizing", d: "Not letting one bet sink you", progress: 55 },
  { t: "Macro & Rates", d: "How cycles move markets", progress: 15 },
  { t: "Technical Analysis", d: "Reading price and trend", progress: 10 },
];

export default function AcademyPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Learning Center</div>
      <h1 className="mb-2 font-display text-3xl font-bold">Investing Academy</h1>
      <p className="mb-6 max-w-xl text-muted">Bite-size lessons with an AI tutor. Pick up where you left off.</p>

      <GlassCard className="mb-4 flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-blue/[0.12]">
          <GraduationCap className="h-5 w-5 text-blue" />
        </span>
        <div>
          <div className="font-display font-semibold">AI Tutor</div>
          <div className="text-[13px] text-muted">
            Ask any concept in plain English and get a beginner-friendly answer. Live with an API key.
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <GlassCard key={t.t}>
            <div className="font-display text-[15px] font-semibold">{t.t}</div>
            <div className="mt-1 text-[12.5px] text-muted">{t.d}</div>
            <div className="my-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-blue to-emerald" style={{ width: `${t.progress}%` }} />
            </div>
            <div className="text-[12px] text-muted">
              {t.progress}% complete · <span className="text-blue">Resume</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
