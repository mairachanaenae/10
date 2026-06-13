import { AutonomousLoop } from "@/components/autonomous/AutonomousLoop";

export default function AutonomousPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Autonomous Agents</div>
      <h1 className="mb-1 font-display text-3xl font-bold">Task-Driven Agent Loop</h1>
      <p className="mb-6 max-w-xl text-muted">
        A BabyAGI-style loop: agents pull a task, execute it, store the result in memory, then create
        and reprioritize new tasks. Hit Run and watch them light up.
      </p>
      <AutonomousLoop />
    </>
  );
}
