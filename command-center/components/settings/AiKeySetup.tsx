"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { clearApiKey, getApiKey, setApiKey, verifyKey } from "@/lib/browser-ai";

type Status = "idle" | "verifying" | "ok" | "err";

export function AiKeySetup() {
  const [key, setKey] = useState("");
  const [present, setPresent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    setPresent(Boolean(getApiKey()));
  }, []);

  async function saveAndVerify() {
    if (!key.trim()) return;
    setApiKey(key);
    setPresent(true);
    setStatus("verifying");
    setErr("");
    const e = await verifyKey();
    if (e) {
      setStatus("err");
      setErr(e);
    } else {
      setStatus("ok");
      setKey("");
    }
  }

  function disconnect() {
    clearApiKey();
    setPresent(false);
    setStatus("idle");
    setKey("");
  }

  return (
    <div className="glass max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-emerald/[0.14]">
          <KeyRound className="h-5 w-5 text-emerald" />
        </span>
        <div>
          <div className="font-display font-semibold">Connect Claude (make the agents live)</div>
          <div className="text-[13px] text-muted">
            Paste your Anthropic API key. It is stored only in this browser and sent only to Anthropic.
          </div>
        </div>
        <span
          className={
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] " +
            (present ? "border-emerald text-emerald" : "border-line text-muted")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (present ? "bg-emerald animate-pulse-dot" : "bg-faint")} />
          {present ? "connected" : "not connected"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          aria-label="Anthropic API key"
          className="min-w-[240px] flex-1 rounded-xl border border-line bg-white/[0.045] px-4 py-3 font-mono text-[13px] text-ink outline-none focus:border-emerald"
        />
        <button
          onClick={saveAndVerify}
          className="rounded-xl bg-emerald px-5 py-3 font-display font-semibold text-[#06140d] transition active:translate-y-px"
        >
          Save &amp; verify
        </button>
        {present && (
          <button onClick={disconnect} className="rounded-xl border border-line2 px-5 py-3 font-display font-semibold text-muted hover:text-ink">
            Disconnect
          </button>
        )}
      </div>

      {status === "verifying" && <p className="mt-3 text-[13px] text-muted">Verifying…</p>}
      {status === "ok" && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-emerald">
          <CheckCircle2 className="h-4 w-4" /> Connected. Mentors, agents, and the autonomous loop are now live.
        </p>
      )}
      {status === "err" && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-danger">
          <XCircle className="h-4 w-4" /> {err}
        </p>
      )}

      <p className="mt-4 text-[11px] text-faint">
        Get a key at platform.claude.com. This browser-direct mode is for your own personal use; for a
        shared/secure deployment, use the Vercel + server setup in the README.
      </p>
    </div>
  );
}
