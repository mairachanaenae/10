// Server component: content is visible by default and reveals via pure CSS
// (animate-fade), so it renders even if client JS never hydrates. Single emerald
// accent, asymmetric split hero with a real component preview, zero em-dashes.

import Link from "next/link";
import { ArrowRight, Bot, LineChart, Sparkles, Users } from "lucide-react";
import { Counter } from "@/components/ui/Counter";

export default function Landing() {
  return (
    <div className="min-h-[100dvh]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 rounded-md bg-emerald/90" />
          <span className="font-display text-sm font-semibold tracking-tight">Command Center</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-line2 px-4 py-2 text-sm text-ink transition hover:border-emerald hover:text-emerald"
        >
          Enter
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <p className="animate-fade text-[11px] uppercase tracking-[0.24em] text-emerald/90">
            AI-powered investing
          </p>
          <h1
            className="animate-fade mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Run your money like a <span className="italic text-emerald">command center.</span>
          </h1>
          <p
            className="animate-fade mt-5 max-w-[52ch] text-[15px] leading-relaxed text-muted"
            style={{ animationDelay: "120ms" }}
          >
            Track your portfolio, learn from AI mentors, and deploy autonomous agents. One calm,
            premium home for building long-term wealth.
          </p>
          <div className="animate-fade mt-8 flex flex-wrap items-center gap-5" style={{ animationDelay: "180ms" }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald px-5 py-3 font-display font-semibold text-[#06140d] transition active:translate-y-px"
            >
              Enter the Command Center
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/mentors" className="text-sm text-muted transition hover:text-ink">
              See the AI mentors
            </Link>
          </div>
        </div>

        <div className="animate-fade glass relative overflow-hidden p-6" style={{ animationDelay: "120ms" }}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted">Net Worth</div>
          <div className="mt-2 font-display text-4xl font-bold text-gold">
            <Counter to={11725} prefix="NOK " />
          </div>
          <div className="mt-1 text-[13px] text-emerald">+ NOK 88 today</div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Portfolio</div>
              <div className="mt-1 font-display text-xl font-semibold">
                <Counter to={10225} prefix="NOK " />
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Freedom score</div>
              <div className="mt-1 font-display text-xl font-semibold text-emerald">
                <Counter to={47} suffix=" / 100" />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald/10 blur-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="animate-fade mb-8 max-w-xl font-display text-2xl font-semibold md:text-3xl">
          A portfolio tracker, a teacher, and a team of agents in one.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="animate-fade glass relative overflow-hidden p-6 md:col-span-2 md:row-span-2">
            <Users className="h-6 w-6 text-emerald" />
            <h3 className="mt-4 font-display text-xl font-semibold">AI Mentor Hub</h3>
            <p className="mt-2 max-w-md text-[14px] text-muted">
              Four mentors with distinct philosophies, long-term, growth, value, and macro, react to
              your holdings and answer your questions in plain language.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Long-Term", "Growth", "Value", "Macro"].map((t) => (
                <span key={t} className="rounded-full border border-line px-3 py-1 text-[12px] text-muted">
                  {t}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-emerald/[0.07] blur-2xl" />
          </div>

          <div className="animate-fade glass p-6" style={{ animationDelay: "80ms" }}>
            <Bot className="h-6 w-6 text-blue" />
            <h3 className="mt-4 font-display text-lg font-semibold">Specialized Agents</h3>
            <p className="mt-2 text-[13.5px] text-muted">
              Analyst, portfolio manager, opportunity finder, and research agents with live task
              queues.
            </p>
          </div>

          <div className="animate-fade glass p-6" style={{ animationDelay: "140ms" }}>
            <Sparkles className="h-6 w-6 text-gold" />
            <h3 className="mt-4 font-display text-lg font-semibold">Autonomous Loop</h3>
            <p className="mt-2 text-[13.5px] text-muted">
              A self-running task loop that pulls, executes, remembers, and reprioritizes on its own.
            </p>
          </div>
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-line pt-6 text-[12px] text-faint">
          <span className="flex items-center gap-2">
            <LineChart className="h-3.5 w-3.5" /> Built with Claude
          </span>
          <span>Educational only, not financial advice.</span>
        </div>
      </section>
    </div>
  );
}
