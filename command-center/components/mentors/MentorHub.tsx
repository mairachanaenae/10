"use client";

import { useEffect, useRef, useState } from "react";
import { MENTORS } from "@/lib/mentors";
import { chat, hasKey, type Msg as AiMsg } from "@/lib/browser-ai";
import { portfolioContext } from "@/lib/portfolio-context";

interface Msg {
  who: "me" | "ai";
  text: string;
}

export function MentorHub() {
  const [activeId, setActiveId] = useState(MENTORS[0].id);
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>(() =>
    Object.fromEntries(
      MENTORS.map((m) => [m.id, [{ who: "ai", text: `Hi, I'm your ${m.name}. Ask me about a holding, dividends, risk, or strategy.` }]]),
    ),
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const active = MENTORS.find((m) => m.id === activeId)!;
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLive(hasKey()), []);

  function scrollDown() {
    requestAnimationFrame(() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight }));
  }

  async function send() {
    const v = input.trim();
    if (!v || busy) return;
    setInput("");
    const id = activeId;
    setMsgs((prev) => ({ ...prev, [id]: [...prev[id], { who: "me", text: v }] }));
    scrollDown();

    if (!hasKey()) {
      setTimeout(() => {
        setMsgs((prev) => ({ ...prev, [id]: [...prev[id], { who: "ai", text: active.fallback(v) }] }));
        scrollDown();
      }, 320);
      return;
    }

    setBusy(true);
    try {
      const history: AiMsg[] = msgs[id]
        .filter((_, i) => i > 0) // drop the canned greeting
        .map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.text }));
      history.push({ role: "user", content: v });
      const system =
        active.systemPrompt +
        "\n\nThe user's current portfolio (reason about these specific positions when relevant):\n" +
        portfolioContext();
      const reply = await chat(system, history, 500);
      setMsgs((prev) => ({ ...prev, [id]: [...prev[id], { who: "ai", text: reply || active.fallback(v) }] }));
    } catch (e) {
      const note = e instanceof Error ? e.message : "request failed";
      setMsgs((prev) => ({
        ...prev,
        [id]: [...prev[id], { who: "ai", text: active.fallback(v) + `\n\n(Live Claude unavailable: ${note})` }],
      }));
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {MENTORS.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveId(m.id)}
            className={
              "glass p-4 text-left transition hover:-translate-y-[2px] " +
              (m.id === activeId ? "ring-1 ring-emerald" : "")
            }
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-blue/[0.12] text-xl">
                {m.emoji}
              </span>
              <div>
                <div className="font-display text-[15px] font-semibold">{m.name}</div>
                <div className="text-[12px] text-muted">
                  <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald align-middle" />
                  online · {m.focus}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="glass flex flex-col p-5">
        <div className="mb-3 flex items-center gap-2 font-display text-[13px] font-semibold">
          {active.emoji} {active.name}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-normal text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald" /> {live ? "live · Claude" : "online"}
          </span>
        </div>
        <div ref={boxRef} className="flex h-[300px] flex-col gap-2 overflow-auto pr-1">
          {msgs[activeId].map((m, i) => (
            <div
              key={i}
              className={
                m.who === "me"
                  ? "max-w-[82%] self-end whitespace-pre-wrap rounded-2xl border border-line2 bg-blue/[0.14] px-3 py-2 text-[13.5px]"
                  : "max-w-[82%] self-start whitespace-pre-wrap rounded-2xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px]"
              }
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="max-w-[82%] self-start rounded-2xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px] text-muted">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald" />
                thinking…
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about a holding, risk, dividends…"
            className="flex-1 rounded-xl border border-line bg-white/[0.045] px-3 py-2.5 text-[13.5px] outline-none placeholder:text-faint"
            aria-label="Message the mentor"
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl border border-line2 bg-blue/[0.14] px-4 font-display font-semibold text-blue disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          {live
            ? "Live Claude, grounded in your portfolio. Educational only — not financial advice."
            : "Rule-based demo replies. Add your Anthropic key in Settings to make this a live Claude mentor."}
        </p>
      </div>
    </div>
  );
}
