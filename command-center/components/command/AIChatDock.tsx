"use client";

import { Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { chat, hasKey, type Msg as AiMsg } from "@/lib/browser-ai";
import { portfolioContext } from "@/lib/portfolio-context";

interface Msg {
  who: "me" | "ai";
  text: string;
}

export function AIChatDock() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "ai", text: "Hi — ask me to summarize your portfolio, explain a holding, or assess risk." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight }));
  }

  async function send() {
    const v = input.trim();
    if (!v || busy) return;
    setInput("");
    setMsgs((m) => [...m, { who: "me", text: v }]);
    scrollDown();

    if (!hasKey()) {
      setTimeout(() => {
        setMsgs((m) => [
          ...m,
          {
            who: "ai",
            text: "I'm in demo mode. Add your Anthropic key in Settings and I'll answer live, grounded in your portfolio. For now, open Mentors to chat with a persona.",
          },
        ]);
        scrollDown();
      }, 320);
      return;
    }

    setBusy(true);
    try {
      const history: AiMsg[] = msgs
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.text }));
      history.push({ role: "user", content: v });
      const system =
        "You are the command-center AI assistant for a personal investor. Be concise and practical, " +
        "grounded in the portfolio below. Educational only, never financial advice.\n\nPortfolio:\n" +
        portfolioContext();
      const reply = await chat(system, history, 400);
      setMsgs((m) => [...m, { who: "ai", text: reply || "No response." }]);
    } catch (e) {
      setMsgs((m) => [...m, { who: "ai", text: `Live AI unavailable: ${e instanceof Error ? e.message.slice(0, 80) : "error"}` }]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  return (
    <div className="fixed bottom-[84px] right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <div className="glass glass-raised mb-3 w-[min(360px,92vw)] animate-fade p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold">AI Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4 text-muted hover:text-ink" />
            </button>
          </div>
          <div ref={boxRef} className="flex h-[min(260px,46vh)] flex-col gap-2 overflow-auto pr-1">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.who === "me"
                    ? "max-w-[85%] self-end whitespace-pre-wrap rounded-xl border border-line2 bg-blue/[0.14] px-3 py-2 text-[13.5px]"
                    : "max-w-[85%] self-start whitespace-pre-wrap rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px]"
                }
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] self-start rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald" /> thinking…
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Summarize my portfolio…"
              className="min-w-0 flex-1 rounded-xl border border-line bg-white/[0.045] px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-faint"
              aria-label="Message the assistant"
            />
            <button
              onClick={send}
              disabled={busy}
              aria-label="Send"
              className="grid w-11 flex-none place-items-center rounded-xl border border-line2 bg-blue/[0.14] font-display font-semibold text-blue disabled:opacity-50"
            >
              ↑
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className="grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-gradient-to-br from-blue to-violet text-[#06101f] shadow-[0_12px_30px_rgba(110,168,254,.4)] sm:h-14 sm:w-14"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    </div>
  );
}
