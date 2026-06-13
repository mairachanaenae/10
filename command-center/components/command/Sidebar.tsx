"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { NAV, SECONDARY } from "./nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r border-line bg-surface/70 p-3.5 backdrop-blur transition-[width] duration-300 md:flex",
        collapsed ? "w-[74px]" : "w-[248px]",
      )}
      aria-label="Command navigation"
    >
      <div className="mb-5 flex items-center gap-3 px-2 py-1.5">
        <span className="h-[30px] w-[30px] flex-none rounded-[9px] bg-gradient-to-br from-blue via-violet to-emerald shadow-glow" />
        {!collapsed && (
          <span className="whitespace-nowrap font-display text-sm font-bold tracking-wide">
            Command Center
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto grid h-7 w-7 place-items-center rounded-full border border-line2 bg-surface2 text-muted hover:text-ink"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted transition hover:border-line hover:bg-white/[0.04] hover:text-ink",
                active && "border-line2 bg-blue/[0.14] text-ink shadow-glow",
              )}
            >
              <Icon className="h-5 w-5 flex-none" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        {SECONDARY.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:text-ink"
          >
            <Icon className="h-5 w-5 flex-none" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        {!collapsed && <p className="px-2 pt-1 text-[11px] text-faint">v1 · production build</p>}
      </div>
    </nav>
  );
}
