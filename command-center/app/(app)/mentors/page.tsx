import { MentorHub } from "@/components/mentors/MentorHub";

export default function MentorsPage() {
  return (
    <>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-faint">Financial Mentors</div>
      <h1 className="mb-1 font-display text-3xl font-bold">AI Mentor Hub</h1>
      <p className="mb-6 text-muted">Pick a mentor and chat. Each thinks in their own philosophy.</p>
      <MentorHub />
    </>
  );
}
