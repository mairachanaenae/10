import { AiKeySetup } from "@/components/settings/AiKeySetup";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald">Settings</div>
        <h1 className="mt-1 font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-muted">
          Connect Claude to make the Mentors, Agents, and Autonomous loop genuinely reason about your
          portfolio. Without a key, they run in a rule-based demo mode.
        </p>
      </div>
      <AiKeySetup />
    </div>
  );
}
