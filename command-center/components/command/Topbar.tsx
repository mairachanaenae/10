"use client";

import { Search } from "lucide-react";

export function Topbar({ name }: { name: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex max-w-[420px] flex-1 items-center gap-2 rounded-xl border border-line bg-white/[0.045] px-3.5 py-2.5 text-[13.5px] text-muted">
        <Search className="h-4 w-4" />
        <input
          className="flex-1 bg-transparent text-ink outline-none placeholder:text-faint"
          placeholder="Search markets, ask the AI…"
          aria-label="Search"
        />
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.045] px-3 py-1.5 text-[12.5px] text-muted">
        <span className="h-[7px] w-[7px] animate-pulse-dot rounded-full bg-emerald shadow-[0_0_8px_var(--emerald)]" />
        Markets live
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-blue to-violet font-display font-bold text-[#06101f]">
        {name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}
