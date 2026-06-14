import { AiKeySetup } from "@/components/settings/AiKeySetup";
import { NewsKeySetup } from "@/components/settings/NewsKeySetup";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue">Settings</div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-muted">
          Connect Claude to make the Mentors, Agents, and Autonomous loop genuinely reason about your
          portfolio, and Finnhub for live news. Without keys, everything runs in demo mode.
        </p>
      </div>
      <AiKeySetup />
      <NewsKeySetup />
    </div>
  );
}
