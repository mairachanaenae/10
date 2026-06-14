"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Newspaper, XCircle } from "lucide-react";
import { clearNewsKey, getNewsKey, setNewsKey, verifyNewsKey } from "@/lib/news-api";

type Status = "idle" | "verifying" | "ok" | "err";

export function NewsKeySetup() {
  const [key, setKey] = useState("");
  const [present, setPresent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    setPresent(Boolean(getNewsKey()));
  }, []);

  async function saveAndVerify() {
    if (!key.trim()) return;
    setNewsKey(key);
    setPresent(true);
    setStatus("verifying");
    setErr("");
    const e = await verifyNewsKey();
    if (e) {
      setStatus("err");
      setErr(e);
    } else {
      setStatus("ok");
      setKey("");
    }
  }

  function disconnect() {
    clearNewsKey();
    setPresent(false);
    setStatus("idle");
    setKey("");
  }

  return (
    <div className="glass sheen max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-blue/[0.14]">
          <Newspaper className="h-5 w-5 text-blue" strokeWidth={1.75} />
        </span>
        <div>
          <div className="font-display font-semibold">Connect live news (Finnhub)</div>
          <div className="text-[13px] text-muted">
            Paste a free Finnhub API key for real, ticker-filtered headlines. Stored only in this browser.
          </div>
        </div>
        <span
          className={
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] " +
            (present ? "border-blue text-blue" : "border-line text-muted")
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + (present ? "bg-blue animate-pulse-dot" : "bg-faint")} />
          {present ? "connected" : "not connected"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="finnhub api key"
          aria-label="Finnhub API key"
          className="min-w-[240px] flex-1 rounded-xl border border-line bg-white/[0.045] px-4 py-3 font-mono text-[13px] text-ink outline-none focus:border-blue"
        />
        <button
          onClick={saveAndVerify}
          className="rounded-xl bg-blue px-5 py-3 font-display font-semibold text-[#06140d] transition active:translate-y-px"
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
        <p className="mt-3 flex items-center gap-2 text-[13px] text-blue">
          <CheckCircle2 className="h-4 w-4" /> Connected. The News page now shows live headlines.
        </p>
      )}
      {status === "err" && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-danger">
          <XCircle className="h-4 w-4" /> {err}
        </p>
      )}

      <p className="mt-4 text-[11px] text-faint">
        Get a free key at finnhub.io. For a shared deployment, set FINNHUB_API_KEY on Vercel instead
        (the /api/news server route keeps it private).
      </p>
    </div>
  );
}
