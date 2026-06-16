"use client";

// A small original browser game for the Town tab: steer your investor around
// town, collect dividend coins, dodge "volatility". No emulator, no ROM - pure
// canvas + requestAnimationFrame. Keyboard (WASD/arrows) or click/hold to move.
import { useEffect, useRef, useState } from "react";

const W = 1000, H = 600, ROUND = 45; // seconds

// warm "game board" palette (theme-independent so it reads in light + dark)
const C = {
  board: "#F1ECE0", grid: "rgba(39,35,32,.05)", ink: "#2B2620", mute: "#6B6358",
  bld: "#FFFFFF", bldEdge: "#C9C0AE", player: "#3E6B52", coin: "#C79A3E", coinEdge: "#9A6B2E",
  hazard: "#B0463F", shadow: "rgba(39,35,32,.14)",
};
const BUILDINGS = [
  { x: 200, y: 130, w: 120, h: 70, label: "Bank" },
  { x: 800, y: 140, w: 130, h: 70, label: "Market" },
  { x: 500, y: 330, w: 130, h: 76, label: "Workshop" },
  { x: 180, y: 440, w: 120, h: 70, label: "Library" },
  { x: 820, y: 450, w: 130, h: 70, label: "Trading" },
  { x: 500, y: 90, w: 120, h: 62, label: "Town Hall" },
];

interface Coin { x: number; y: number; v: number }
interface Hazard { x: number; y: number; vx: number; vy: number }

export function TownGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(ROUND);
  const [best, setBest] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  // mutable game state (kept out of React to avoid per-frame renders)
  const g = useRef({
    px: W / 2, py: H / 2, vx: 0, vy: 0,
    keys: {} as Record<string, boolean>,
    pointer: null as { x: number; y: number } | null,
    coins: [] as Coin[],
    hazards: [] as Hazard[],
    score: 0, flash: 0, lastSpawn: 0,
  });

  useEffect(() => { setBest(Number(localStorage.getItem("cc_towngame_best") || 0)); }, []);

  function start() {
    const s = g.current;
    s.px = W / 2; s.py = H / 2; s.vx = 0; s.vy = 0; s.score = 0; s.flash = 0;
    s.coins = []; s.hazards = [
      { x: 180, y: 300, vx: 2.4, vy: 1.8 },
      { x: 820, y: 300, vx: -2.1, vy: 2.2 },
    ];
    setScore(0); setTime(ROUND); setRunning(true); setStarted(true);
  }

  // round timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => {
      if (t <= 1) {
        setRunning(false);
        const b = Math.max(g.current.score, Number(localStorage.getItem("cc_towngame_best") || 0));
        localStorage.setItem("cc_towngame_best", String(b)); setBest(b);
        window.dispatchEvent(new Event("cc-towngame"));
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [running]);

  // input
  useEffect(() => {
    const down = (e: KeyboardEvent) => { g.current.keys[e.key.toLowerCase()] = true; if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault(); };
    const up = (e: KeyboardEvent) => { g.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // game loop
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let raf = 0;
    const SPEED = 0.55, FRICT = 0.86, MAX = 4.6;

    const loop = (ts: number) => {
      const s = g.current;
      if (running) {
        // desired direction
        let dx = 0, dy = 0;
        const k = s.keys;
        if (k["arrowleft"] || k["a"]) dx -= 1;
        if (k["arrowright"] || k["d"]) dx += 1;
        if (k["arrowup"] || k["w"]) dy -= 1;
        if (k["arrowdown"] || k["s"]) dy += 1;
        if (dx === 0 && dy === 0 && s.pointer) {
          const tx = s.pointer.x - s.px, ty = s.pointer.y - s.py; const d = Math.hypot(tx, ty);
          if (d > 6) { dx = tx / d; dy = ty / d; }
        }
        const dl = Math.hypot(dx, dy) || 1;
        s.vx = (s.vx + (dx / dl) * SPEED) * FRICT;
        s.vy = (s.vy + (dy / dl) * SPEED) * FRICT;
        const sp = Math.hypot(s.vx, s.vy); if (sp > MAX) { s.vx = s.vx / sp * MAX; s.vy = s.vy / sp * MAX; }
        s.px = Math.max(16, Math.min(W - 16, s.px + s.vx));
        s.py = Math.max(16, Math.min(H - 16, s.py + s.vy));

        // spawn coins
        if (ts - s.lastSpawn > 900 && s.coins.length < 7) {
          s.lastSpawn = ts;
          s.coins.push({ x: 60 + Math.random() * (W - 120), y: 60 + Math.random() * (H - 120), v: 10 });
        }
        // collect
        s.coins = s.coins.filter((c) => {
          if (Math.hypot(c.x - s.px, c.y - s.py) < 22) { s.score += c.v; setScore(s.score); return false; }
          return true;
        });
        // hazards
        for (const h of s.hazards) {
          h.x += h.vx; h.y += h.vy;
          if (h.x < 14 || h.x > W - 14) h.vx *= -1;
          if (h.y < 14 || h.y > H - 14) h.vy *= -1;
          if (Math.hypot(h.x - s.px, h.y - s.py) < 24) {
            s.score = Math.max(0, s.score - 15); setScore(s.score); s.flash = 1;
            // knockback
            const a = Math.atan2(s.py - h.y, s.px - h.x); s.vx = Math.cos(a) * 7; s.vy = Math.sin(a) * 7;
          }
        }
        if (s.flash > 0) s.flash -= 0.06;
      }

      // ---- render ----
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.board; ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // buildings
      for (const b of BUILDINGS) {
        ctx.fillStyle = C.shadow; rr(ctx, b.x - b.w / 2 + 3, b.y - b.h / 2 + 5, b.w, b.h, 10); ctx.fill();
        ctx.fillStyle = C.bld; ctx.strokeStyle = C.bldEdge; ctx.lineWidth = 1.5;
        rr(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.mute; ctx.font = "italic 14px Newsreader, Georgia, serif"; ctx.textAlign = "center";
        ctx.fillText(b.label, b.x, b.y + b.h / 2 + 18);
      }
      // coins
      for (const c of g.current.coins) {
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.fillStyle = C.coin; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = C.coinEdge; ctx.stroke();
      }
      // hazards
      for (const h of g.current.hazards) {
        ctx.beginPath(); ctx.arc(h.x, h.y, 12, 0, 7); ctx.fillStyle = C.hazard; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 13px JetBrains Mono, monospace"; ctx.textAlign = "center"; ctx.fillText("!", h.x, h.y + 4.5);
      }
      // player
      const s2 = g.current;
      ctx.beginPath(); ctx.ellipse(s2.px, s2.py + 12, 10, 3.2, 0, 0, 7); ctx.fillStyle = C.shadow; ctx.fill();
      ctx.beginPath(); ctx.arc(s2.px, s2.py, 11, 0, 7); ctx.fillStyle = C.player; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#FBF9F3"; ctx.stroke();
      if (s2.flash > 0) { ctx.fillStyle = `rgba(176,70,63,${s2.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // pointer -> internal coords
  function toLocal(e: React.PointerEvent) {
    const cv = canvas.current!; const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
        <span className="iv-tag">Score <b style={{ color: "var(--paper)", marginLeft: 4 }}>£{score}</b></span>
        <span className="iv-tag">Time <b style={{ color: time <= 10 ? "var(--down)" : "var(--paper)", marginLeft: 4 }}>{time}s</b></span>
        <span className="iv-tag">Best <b style={{ color: "var(--paper)", marginLeft: 4 }}>£{best}</b></span>
        <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "8px 16px", marginLeft: "auto" }} onClick={start}>
          {started && !running ? "Play again" : started ? "Restart" : "Start round"}
        </button>
      </div>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
        <canvas
          ref={canvas} width={W} height={H}
          style={{ width: "100%", height: "auto", display: "block", touchAction: "none", cursor: running ? "none" : "default" }}
          onPointerDown={(e) => { g.current.pointer = toLocal(e); }}
          onPointerMove={(e) => { if (g.current.pointer) g.current.pointer = toLocal(e); }}
          onPointerUp={() => { g.current.pointer = null; }}
          onPointerLeave={() => { g.current.pointer = null; }}
        />
        {(!started || !running) && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(39,35,32,.42)", color: "#F4F1E8", textAlign: "center", padding: 20 }}>
            <div>
              <div className="iv-display" style={{ fontSize: 30, color: "#F4F1E8" }}>{!started ? "Dividend Dash" : "Round over"}</div>
              <p style={{ fontSize: 13.5, opacity: 0.9, margin: "8px 0 16px", maxWidth: 360 }}>
                {!started
                  ? "Collect dividend coins, dodge the red volatility. WASD / arrows, or click and hold to move."
                  : `You banked £${score}. ${score >= best && score > 0 ? "New best!" : `Best £${best}.`}`}
              </p>
              <button className="iv-cta brassbtn" style={{ width: "auto", margin: 0, padding: "10px 20px" }} onClick={start}>{started ? "Play again" : "Start round"}</button>
            </div>
          </div>
        )}
      </div>
      <p className="iv-foot">An original mini-game, not a real market. Coins are +£10, a volatility hit is -£15. {ROUND}-second rounds.</p>
    </div>
  );
}

// rounded-rect helper
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
