"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { SITE_PASSWORD } from "@/lib/gate";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cc_unlocked") === "1") {
      setOk(true);
    }
  }, []);

  if (ok) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === SITE_PASSWORD) {
      sessionStorage.setItem("cc_unlocked", "1");
      setOk(true);
    } else {
      setErr(true);
    }
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4">
      <form onSubmit={submit} className="glass w-[min(400px,94vw)] p-7 text-center">
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line2 bg-emerald/[0.14]">
          <Lock className="h-5 w-5 text-emerald" />
        </div>
        <h1 className="font-display text-xl font-bold">The Investor&apos;s Command Center</h1>
        <p className="mt-1 text-[13px] text-muted">Enter the password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr(false);
          }}
          autoFocus
          placeholder="Password"
          aria-label="Password"
          className="mt-5 w-full rounded-xl border border-line bg-white/[0.045] px-4 py-3 text-center text-ink outline-none focus:border-emerald"
        />
        {err && <p className="mt-2 text-[12px] text-danger">Incorrect password.</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-emerald px-5 py-3 font-display font-semibold text-[#06140d] transition active:translate-y-px"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
