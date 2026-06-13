"use client";

import { useRef, useState } from "react";
import { MENTORS } from "@/lib/mentors";

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
  const active = MENTORS.find((m) => m.id === activeId)!;
  const boxRef = useRef<HTMLDivElement>(null);

  function send() {
    const v = input.trim();
    if (!v) return;
    setInput("");
    setMsgs((prev) => ({ ...prev, [activeId]: [...prev[activeId], { who: "me", text: v }] }));
    setTimeout(() => {
      setMsgs((prev) => ({ ...prev, [activeId]: [...prev[activeId], { who: "ai", text: active.fallback(v) }] }));
      boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
    }, 380);
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
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald" /> online
          </span>
        </div>
        <div ref={boxRef} className="flex h-[300px] flex-col gap-2 overflow-auto pr-1">
          {msgs[activeId].map((m, i) => (
            <div
              key={i}
              className={
                m.who === "me"
                  ? "max-w-[82%] self-end rounded-2xl border border-line2 bg-blue/[0.14] px-3 py-2 text-[13.5px]"
                  : "max-w-[82%] self-start rounded-2xl border border-line bg-white/[0.04] px-3 py-2 text-[13.5px]"
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
            placeholder="Ask about a holding, risk, dividends…"
            className="flex-1 rounded-xl border border-line bg-white/[0.045] px-3 py-2.5 text-[13.5px] outline-none placeholder:text-faint"
            aria-label="Message the mentor"
          />
          <button onClick={send} className="rounded-xl border border-line2 bg-blue/[0.14] px-4 font-display font-semibold text-blue">
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-faint">Rule-based replies. Live Claude streaming connects with an API key.</p>
      </div>
    </div>
  );
}
