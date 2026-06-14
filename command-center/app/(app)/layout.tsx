import { AIChatDock } from "@/components/command/AIChatDock";
import { BottomNav } from "@/components/command/BottomNav";
import { Sidebar } from "@/components/command/Sidebar";
import { Topbar } from "@/components/command/Topbar";
import { getDisplayName } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const name = await getDisplayName();
  return (
    <div className="grid min-h-screen md:grid-cols-[auto_1fr]">
      <Sidebar />
      <main className="w-full max-w-[1280px] px-4 pb-28 pt-4 sm:px-8 sm:pt-5 md:pb-24">
        <Topbar name={name} />
        {children}
      </main>
      <AIChatDock />
      <BottomNav />
    </div>
  );
}
