import { AIChatDock } from "@/components/command/AIChatDock";
import { Sidebar } from "@/components/command/Sidebar";
import { Topbar } from "@/components/command/Topbar";
import { getDisplayName } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const name = await getDisplayName();
  return (
    <div className="grid min-h-screen md:grid-cols-[auto_1fr]">
      <Sidebar />
      <main className="w-full max-w-[1280px] px-4 pb-24 pt-5 sm:px-8">
        <Topbar name={name} />
        {children}
      </main>
      <AIChatDock />
    </div>
  );
}
