"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SITE_PASSWORD } from "@/lib/gate";

// Warm editorial lock screen (matches the Observatory theme): cream paper,
// Newsreader serif, a single olive accent.
const ACCENT = "#3E6B52";
const INK = "#272320";
const PAPER = "#F4F1E8";
const SURFACE = "#FCFAF4";
const MUTE = "#6B6358";
const LINE = "rgba(39,35,32,.14)";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cc_unlocked") === "1") setOk(true);
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
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: PAPER, color: INK, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: "min(440px,94vw)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <span style={{ fontFamily: "'Newsreader',serif", fontStyle: "italic", fontSize: 16, color: MUTE }}>A private investment desk</span>
          <h1 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.08, fontSize: "clamp(32px,7vw,44px)", margin: "12px 0 0" }}>
            The Investor&apos;s<br />Command Center
          </h1>
          <div style={{ width: 36, height: 2, background: ACCENT, margin: "18px auto 0" }} />
        </div>

        <form onSubmit={submit} style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(39,35,32,.05)" }}>
          <label htmlFor="pw" style={{ display: "block", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: MUTE, marginBottom: 8 }}>Password</label>
          <input
            id="pw"
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            autoFocus
            placeholder="Enter to continue"
            aria-label="Password"
            style={{ width: "100%", borderRadius: 10, border: `1px solid ${err ? "#B0463F" : LINE}`, background: "#FFFFFF", padding: "12px 14px", color: INK, outline: "none", fontSize: 15 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
            onBlur={(e) => (e.currentTarget.style.borderColor = err ? "#B0463F" : LINE)}
          />
          {err && <p style={{ marginTop: 8, fontSize: 12.5, color: "#B0463F" }}>That password isn&apos;t right. Try again.</p>}
          <button
            type="submit"
            style={{ marginTop: 16, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, border: 0, background: INK, color: PAPER, padding: "13px", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}
          >
            Enter <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: MUTE, lineHeight: 1.6 }}>
          Private workspace. Educational only, not financial advice.
        </p>
      </div>
    </div>
  );
}
