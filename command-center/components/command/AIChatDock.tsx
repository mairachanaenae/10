"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface Msg {
  who: "me" | "ai";
  text: string;
}

export function AIChatDock() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "ai", text: "Hi ✦ Ask me to summarize your portfolio, explain a holding, or assess risk." },
  ]);
  const [input, setInput] = useState("");

  function send() {
    const v = input.trim();
    if (!v) return;
    setMsgs((m) => [...m, { who: "me", text: v }]);
    setInput("");
    // M3 streams a real Claude reply here; for now a helpful canned response.
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          who: "ai",
          text: "Live Claude answers unlock once an ANTHROPIC_API_KEY is connected. For now: open the Mentors tab to chat with a specific persona.",
        },
      ]);
    }, 350);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="glass mb-3 w-[min(360px,92vw)] animate-fade p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold">AI Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4 text-muted hover:text-ink" />
            </button>
          </div>
          <div className="flex h-[240px] flex-col gap-2 overflow-auto pr-1">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.who === "me"
                    ? "max-w-[85%] self-end rounded-xl border border-line2 bg-blue/[0.14] px-3 py-2 text-[13.5px]"
                    : "max-w-[85%] self-start rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px]"
                }
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Summarize my portfolio…"
              className="flex-1 rounded-xl border border-line bg-white/[0.045] px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-faint"
              aria-label="Message the assistant"
            />
            <button
              onClick={send}
              className="rounded-xl border border-line2 bg-blue/[0.14] px-3 font-display font-semibold text-blue"
            >
              ↑
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className="grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-blue to-violet text-2xl text-[#06101f] shadow-[0_12px_30px_rgba(110,168,254,.4)]"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    </div>
  );
}
