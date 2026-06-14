"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, MoreHorizontal, Newspaper, Users, Wallet, X } from "lucide-react";
import { NAV, SECONDARY } from "./nav";
import { cn } from "@/lib/utils";

// The 4 most-used destinations live on the bar; everything else is in "More".
const PRIMARY = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/mentors", label: "Mentors", icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line bg-surface/85 backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition",
                active ? "text-blue" : "text-muted",
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.7} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          aria-label="More"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium text-muted"
        >
          <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.7} />
          More
        </button>
      </nav>

      {/* "More" sheet — full nav */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm"
          />
          <div className="glass-raised pb-safe absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl p-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-3 flex items-center px-1">
              <span className="font-display text-sm font-bold tracking-wide">All sections</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-line2 bg-surface2 text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...NAV, ...SECONDARY].map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center text-[12px] transition",
                      active
                        ? "border-line2 bg-blue/[0.14] text-ink shadow-glow"
                        : "border-line bg-white/[0.03] text-muted active:bg-white/[0.06]",
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                    <span className="leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
