"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SECONDARY } from "./nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // lock body scroll while the drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-line bg-white/[0.045] text-ink"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade"
          />
          <nav className="glass-raised absolute left-0 top-0 flex h-[100dvh] w-[82vw] max-w-[300px] flex-col rounded-l-none rounded-r-2xl p-4">
            <div className="mb-5 flex items-center gap-3 px-1 py-1">
              <span className="h-[30px] w-[30px] flex-none rounded-[9px] bg-gradient-to-br from-blue via-violet to-emerald shadow-glow" />
              <span className="font-display text-sm font-bold tracking-wide">Command Center</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-line2 bg-surface2 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-[15px] text-muted transition hover:border-line hover:bg-white/[0.04] hover:text-ink",
                      active && "border-line2 bg-blue/[0.14] text-ink shadow-glow",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-none" strokeWidth={1.75} />
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-2 flex flex-col gap-1 border-t border-line pt-3">
              {SECONDARY.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-muted hover:text-ink"
                >
                  <Icon className="h-5 w-5 flex-none" strokeWidth={1.75} />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
