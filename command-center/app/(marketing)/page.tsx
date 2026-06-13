import Link from "next/link";
import { ArrowRight, Bot, LineChart, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.045] px-4 py-1.5 text-[12px] text-muted">
        <span className="h-[7px] w-[7px] animate-pulse-dot rounded-full bg-emerald" /> AI-powered · built with Claude
      </span>
      <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
        The Investor&apos;s
        <br />
        <span className="bg-gradient-to-r from-blue via-violet to-emerald bg-clip-text text-transparent">
          Command Center
        </span>
      </h1>
      <p className="mt-5 max-w-xl text-muted">
        Your personal financial operating system — monitor investments, learn from AI mentors,
        deploy autonomous agents, and build long-term financial freedom.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-line2 bg-blue/[0.16] px-5 py-3 font-display font-semibold text-blue transition hover:border-blue"
        >
          Enter the Command Center <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
        {[
          { icon: LineChart, t: "Live Portfolio", d: "Wealth map, charts, KPIs" },
          { icon: Bot, t: "AI Mentors & Agents", d: "Four mentors, four agents" },
          { icon: Sparkles, t: "Autonomous Loop", d: "Self-running task agents" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="glass p-5 text-left">
            <Icon className="h-5 w-5 text-blue" />
            <div className="mt-3 font-display font-semibold">{t}</div>
            <div className="text-[13px] text-muted">{d}</div>
          </div>
        ))}
      </div>

      <p className="mt-12 text-[11px] text-faint">Educational only — not financial advice.</p>
    </main>
  );
}
