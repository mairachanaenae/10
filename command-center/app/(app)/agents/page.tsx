import { AgentsBoard } from "@/components/agents/AgentsBoard";

export default function AgentsPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">AI Agent System</div>
      <h1 className="mb-1 font-display text-3xl font-bold">Specialized Agents</h1>
      <p className="mb-6 text-muted">Run an agent and watch its task queue work in real time.</p>
      <AgentsBoard />
    </>
  );
}
