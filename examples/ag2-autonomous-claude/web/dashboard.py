#!/usr/bin/env python3
"""Generate a Solo-Leveling-styled, responsive finance dashboard (one HTML file).

Real dividend-stock data is baked in; the UI re-skins it as an RPG "System": you are the
Player (a Dividend Hunter), each stock is a Hunter ranked E->S by its dividend-safety
"Power Level", with KPIs as stats, an XP bar, charts, a hunter roster table, and a quest
log. Responsive (desktop + tablet), keyboard-navigable, reduced-motion aware. No server,
no key, no internet once built.

    python3 web/dashboard.py            # default tickers -> web/dashboard.html
    python3 web/dashboard.py KO PEP O   # your own tickers
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_static import DEFAULT_TICKERS, fetch_struct  # noqa: E402

TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SYSTEM — Hunter Finance Dashboard</title>
<style>
  :root{
    --bg:#05070f; --bg2:#080c1a; --panel:rgba(13,22,46,.72); --line:rgba(80,140,255,.28);
    --cyan:#38e0ff; --blue:#4ea1ff; --violet:#a78bfa; --gold:#ffd166;
    --ink:#dbe9ff; --muted:#7e92c4; --good:#5ef0b0; --bad:#ff6b8a; --warn:#ffce6b;
    --glow:0 0 18px rgba(56,224,255,.35); --glow-soft:0 0 30px rgba(78,161,255,.18);
  }
  *{box-sizing:border-box;}
  html,body{margin:0;background:
     radial-gradient(1200px 600px at 80% -10%, rgba(78,161,255,.10), transparent 60%),
     radial-gradient(900px 500px at -10% 110%, rgba(167,139,250,.10), transparent 55%),
     var(--bg);
     color:var(--ink); font-family:"Segoe UI",-apple-system,Roboto,Helvetica,Arial,sans-serif;}
  a{color:inherit;}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
  .app{display:grid;grid-template-columns:230px 1fr;min-height:100vh;}
  /* ---------- sidebar ---------- */
  nav.side{border-right:1px solid var(--line);padding:18px 14px;
           background:linear-gradient(180deg, rgba(10,16,36,.85), rgba(6,9,18,.85));}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.28em;
         font-size:13px;color:var(--cyan);text-shadow:var(--glow);margin:4px 6px 22px;}
  .brand .mark{width:22px;height:22px;border:2px solid var(--cyan);transform:rotate(45deg);
               box-shadow:var(--glow);}
  nav.side button{display:flex;align-items:center;gap:11px;width:100%;text-align:left;
       background:transparent;border:1px solid transparent;border-radius:12px;color:var(--muted);
       padding:11px 12px;margin:3px 0;font-size:13.5px;letter-spacing:.06em;cursor:pointer;
       text-transform:uppercase;transition:.18s;}
  nav.side button .ic{width:18px;text-align:center;}
  nav.side button:hover{color:var(--ink);border-color:var(--line);background:rgba(78,161,255,.06);}
  nav.side button[aria-current="page"]{color:var(--cyan);border-color:var(--line);
       background:linear-gradient(90deg, rgba(56,224,255,.16), transparent);box-shadow:var(--glow-soft);}
  nav.side button:focus-visible{outline:2px solid var(--cyan);outline-offset:2px;}
  /* ---------- main ---------- */
  main{padding:22px clamp(16px,3vw,34px) 60px;max-width:1180px;}
  .topnote{font-size:11px;letter-spacing:.14em;color:var(--muted);text-transform:uppercase;}
  .panel{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:16px;
         padding:18px;box-shadow:var(--glow-soft);backdrop-filter:blur(4px);}
  .panel::before{content:"";position:absolute;inset:0;border-radius:16px;padding:1px;
     background:linear-gradient(120deg, rgba(56,224,255,.5), transparent 40%, rgba(167,139,250,.4));
     -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
     -webkit-mask-composite:xor;mask-composite:exclude;opacity:.5;pointer-events:none;}
  h2.t{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--cyan);
       margin:0 0 14px;display:flex;align-items:center;gap:10px;}
  h2.t::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent);}
  .grid{display:grid;gap:16px;}
  .cols-4{grid-template-columns:repeat(4,1fr);}
  .cols-3{grid-template-columns:repeat(3,1fr);}
  .cols-2{grid-template-columns:1.4fr 1fr;}
  /* player status */
  .player{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:18px;}
  .avatar{width:70px;height:70px;border:2px solid var(--cyan);border-radius:16px;transform:rotate(45deg);
          box-shadow:var(--glow);display:grid;place-items:center;}
  .avatar span{transform:rotate(-45deg);font-size:30px;}
  .pmeta{flex:1;min-width:220px;}
  .pname{font-size:22px;font-weight:800;letter-spacing:.04em;}
  .ptitle{color:var(--muted);font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;}
  .rank-badge{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:14px;
       font-weight:900;font-size:24px;border:2px solid var(--cyan);box-shadow:var(--glow);
       background:rgba(56,224,255,.08);}
  .bars{flex:1;min-width:240px;}
  .barlbl{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.1em;
          text-transform:uppercase;color:var(--muted);margin:8px 0 4px;}
  .bar{height:9px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid var(--line);}
  .bar>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--blue),var(--cyan));
         box-shadow:var(--glow);width:0;transition:width 1.1s cubic-bezier(.2,.8,.2,1);}
  .bar.hp>i{background:linear-gradient(90deg,#2bd17e,#7df0b8);}
  .bar.mp>i{background:linear-gradient(90deg,#4ea1ff,#a78bfa);}
  /* KPI stat cards */
  .kpi .v{font-size:26px;font-weight:800;letter-spacing:.02em;margin-top:4px;}
  .kpi .k{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);}
  .kpi .d{font-size:12px;margin-top:6px;}
  .up{color:var(--good);} .down{color:var(--bad);}
  /* roster table */
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  th,td{text-align:left;padding:11px 10px;border-bottom:1px solid var(--line);}
  th{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600;}
  tbody tr{transition:.15s;cursor:default;}
  tbody tr:hover{background:rgba(78,161,255,.07);}
  .rk{font-weight:900;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:7px;
      border:1px solid var(--line);font-size:13px;}
  .rk.S{color:#0a0f1f;background:linear-gradient(90deg,var(--gold),#fff3c4);border-color:var(--gold);box-shadow:0 0 12px rgba(255,209,102,.5);}
  .rk.A{color:var(--cyan);border-color:var(--cyan);}
  .rk.B{color:var(--blue);} .rk.C{color:var(--violet);} .rk.D,.rk.E{color:var(--muted);}
  .pl{display:flex;align-items:center;gap:8px;}
  .pl .mini{width:70px;height:6px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;}
  .pl .mini>i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan));}
  /* market cards */
  .mcard .sym{font-weight:800;letter-spacing:.06em;}
  .mcard .nm{font-size:11.5px;color:var(--muted);}
  .mcard svg{width:100%;height:54px;}
  /* quest log */
  .quest{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line);}
  .quest:last-child{border-bottom:0;}
  .quest .chk{width:20px;height:20px;border:2px solid var(--cyan);border-radius:6px;box-shadow:var(--glow);flex:0 0 auto;margin-top:2px;}
  .quest.done .chk{background:var(--cyan);}
  .quest .q .ttl{font-weight:700;} .quest .q .rw{font-size:12px;color:var(--gold);letter-spacing:.05em;}
  /* arise button + toast */
  .arise{margin-top:16px;display:inline-flex;align-items:center;gap:10px;cursor:pointer;
     background:linear-gradient(90deg, rgba(56,224,255,.18), rgba(167,139,250,.18));
     border:1px solid var(--cyan);color:var(--cyan);font-weight:800;letter-spacing:.3em;
     text-transform:uppercase;padding:13px 22px;border-radius:12px;box-shadow:var(--glow);}
  .arise:hover{filter:brightness(1.2);} .arise:focus-visible{outline:2px solid #fff;outline-offset:2px;}
  .toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);opacity:0;
     background:rgba(8,12,26,.95);border:1px solid var(--cyan);box-shadow:var(--glow);color:var(--cyan);
     padding:14px 22px;border-radius:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;
     transition:.4s;pointer-events:none;z-index:50;}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  .view{display:none;} .view.active{display:block;}
  .foot{color:var(--muted);font-size:11px;letter-spacing:.06em;margin-top:30px;}
  /* ---------- responsive (tablet) ---------- */
  @media (max-width:980px){
    .app{grid-template-columns:1fr;}
    nav.side{display:flex;overflow-x:auto;gap:6px;border-right:0;border-bottom:1px solid var(--line);
             padding:10px;position:sticky;top:0;z-index:20;background:rgba(6,9,18,.96);}
    nav.side .brand{display:none;}
    nav.side button{width:auto;white-space:nowrap;margin:0;}
    .cols-4{grid-template-columns:repeat(2,1fr);}
    .cols-3{grid-template-columns:repeat(2,1fr);}
    .cols-2{grid-template-columns:1fr;}
  }
  @media (max-width:560px){ .cols-4,.cols-3{grid-template-columns:1fr;} }
  @media (prefers-reduced-motion:reduce){ *{transition:none!important;animation:none!important;} }
</style>
</head>
<body>
<div class="app">
  <nav class="side" aria-label="System menu">
    <div class="brand"><span class="mark" aria-hidden="true"></span> SYSTEM</div>
    <button data-view="status" aria-current="page"><span class="ic" aria-hidden="true">◈</span> Status</button>
    <button data-view="hunters"><span class="ic" aria-hidden="true">⚔</span> Hunters</button>
    <button data-view="market"><span class="ic" aria-hidden="true">📈</span> Market</button>
    <button data-view="quests"><span class="ic" aria-hidden="true">📜</span> Quests</button>
  </nav>

  <main>
    <p class="topnote">⟡ Notification — A new dungeon (market session) has appeared.</p>

    <!-- PLAYER STATUS -->
    <section class="panel" aria-labelledby="ps" style="margin:10px 0 18px">
      <h2 class="t" id="ps">Player Status</h2>
      <div class="player">
        <div class="avatar" aria-hidden="true"><span>🧑‍🚀</span></div>
        <div class="pmeta">
          <div class="pname">PLAYER</div>
          <div class="ptitle">Class — Dividend Hunter</div>
        </div>
        <div style="text-align:center">
          <div class="rank-badge" id="playerRank" aria-label="Player rank">—</div>
          <div class="ptitle" style="margin-top:6px">Rank</div>
        </div>
        <div class="bars" aria-hidden="false">
          <div class="barlbl"><span>Lv <b id="lvl">—</b> · XP to next</span><span id="xpTxt">—</span></div>
          <div class="bar"><i id="xpBar"></i></div>
          <div class="barlbl"><span>Portfolio HP</span><span id="hpTxt">—</span></div>
          <div class="bar hp"><i id="hpBar"></i></div>
          <div class="barlbl"><span>Cash MP</span><span id="mpTxt">Reserve</span></div>
          <div class="bar mp"><i id="mpBar" style="width:42%"></i></div>
        </div>
      </div>
      <button class="arise" id="arise">⚡ Arise</button>
    </section>

    <!-- VIEW: STATUS -->
    <div class="view active" id="view-status">
      <div class="grid cols-4" role="list" aria-label="Key stats" id="kpis" style="margin-bottom:16px"></div>
      <div class="grid cols-2">
        <section class="panel" aria-labelledby="pv">
          <h2 class="t" id="pv">Portfolio Power — 1Y</h2>
          <svg id="pvChart" viewBox="0 0 640 180" preserveAspectRatio="none" role="img"
               aria-label="Portfolio value trend over the past year"></svg>
          <p class="sr" id="pvSummary"></p>
        </section>
        <section class="panel" aria-labelledby="al">
          <h2 class="t" id="al">Squad Allocation</h2>
          <div id="alloc"></div>
        </section>
      </div>
    </div>

    <!-- VIEW: HUNTERS -->
    <div class="view" id="view-hunters">
      <section class="panel" aria-labelledby="hr">
        <h2 class="t" id="hr">Hunter Roster</h2>
        <div style="overflow-x:auto">
        <table>
          <caption class="sr">Holdings ranked by dividend-safety power level</caption>
          <thead><tr>
            <th scope="col">Rank</th><th scope="col">Hunter</th><th scope="col">Power</th>
            <th scope="col">Income/turn</th><th scope="col">Strain</th><th scope="col">Veteran</th><th scope="col">Price</th>
          </tr></thead>
          <tbody id="roster"></tbody>
        </table>
        </div>
        <p class="foot">“Power Level” = a dividend-safety score (payout, debt, dividend-growth record, yield). A game metaphor, not a buy signal.</p>
      </section>
    </div>

    <!-- VIEW: MARKET -->
    <div class="view" id="view-market">
      <div class="grid cols-3" id="market"></div>
    </div>

    <!-- VIEW: QUESTS -->
    <div class="view" id="view-quests">
      <section class="panel" aria-labelledby="ql">
        <h2 class="t" id="ql">Daily Quest Log</h2>
        <div id="quests"></div>
      </section>
    </div>

    <p class="foot">⟡ Stylized demo — not financial advice. Numbers are a point-in-time snapshot. Built with ag2 + Claude.</p>
  </main>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
const DATA = __DATA__;             // { SYM: {name,price,yield,payout,de,years,hist} }
const SYMS = Object.keys(DATA);

function score(v){
  let s=0;
  s += v.payout<=40?30 : v.payout<=60?24 : v.payout<=75?15 : v.payout<=90?6 : 0;
  s += v.de<=50?25 : v.de<=100?18 : v.de<=150?10 : v.de<=250?4 : 0;
  s += v.years>=25?25 : v.years>=10?18 : v.years>=5?10 : v.years>=1?4 : 0;
  s += v.yield<=5?20 : v.yield<=7?12 : v.yield<=10?5 : 0;
  return Math.round(s);
}
function rank(s){ return s>=80?'S':s>=68?'A':s>=54?'B':s>=40?'C':s>=26?'D':'E'; }
function power(v,s){ return Math.round(s*70 + v.years*45 + 800); }
function esc(x){return String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function $(id){return document.getElementById(id);}

const hunters = SYMS.map(sym=>{const v=DATA[sym]; const s=score(v);
  return {sym, ...v, s, rk:rank(s), pw:power(v,s)};}).sort((a,b)=>b.pw-a.pw);

// ----- player aggregates -----
const avg = Math.round(hunters.reduce((a,h)=>a+h.s,0)/hunters.length);
const level = Math.round(avg/2) + 8;
const playerRank = rank(avg);
const portVal = hunters.reduce((a,h)=>a+(h.price||0)*10,0);
const dayChg = (()=>{let n=0,sum=0; hunters.forEach(h=>{const k=h.hist;
  if(k&&k.length>1){sum+=(k[k.length-1]-k[k.length-2])/k[k.length-2]*100;n++;}}); return n?sum/n:0;})();
const winRate = Math.round(hunters.filter(h=>h.s>=54).length/hunters.length*100);
const sTier = hunters.filter(h=>h.rk==='S'||h.rk==='A').length;

function fmt(n){return n.toLocaleString(undefined,{maximumFractionDigits:0});}

// ----- render player -----
$("playerRank").textContent=playerRank;
$("lvl").textContent=level;
$("xpTxt").textContent=avg+" / 100 XP";
$("hpTxt").textContent=avg+"%";
requestAnimationFrame(()=>{ $("xpBar").style.width=avg+"%"; $("hpBar").style.width=Math.min(100,avg+8)+"%"; });

// ----- KPIs -----
$("kpis").innerHTML=[
  ["Portfolio Power","$"+fmt(portVal),"Total squad value",""],
  ["Today", (dayChg>=0?"+":"")+dayChg.toFixed(2)+"%","vs last session", dayChg>=0?"up":"down"],
  ["Win Rate", winRate+"%","Hunters rank B+",""],
  ["S/A Tier", sTier+" / "+hunters.length,"Elite hunters",""],
].map(([k,v,d,cls])=>`<div class="panel kpi" role="listitem"><div class="k">${k}</div>
   <div class="v ${cls}">${v}</div><div class="d ${cls}">${d}</div></div>`).join("");

// ----- portfolio sparkline (sum of hists) -----
(function(){
  const len=Math.max(...hunters.map(h=>h.hist?.length||0));
  const series=Array.from({length:len},(_,i)=>hunters.reduce((a,h)=>a+((h.hist&&h.hist[i])||0)*10,0));
  const W=640,H=180,pad=8,min=Math.min(...series),max=Math.max(...series),span=(max-min)||1;
  const pts=series.map((p,i)=>{const x=pad+(W-2*pad)*i/(series.length-1);
    const y=pad+(H-2*pad)*(1-(p-min)/span);return x.toFixed(1)+","+y.toFixed(1);}).join(" ");
  const area=`${pad},${H-pad} ${pts} ${W-pad},${H-pad}`;
  $("pvChart").innerHTML=
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="rgba(56,224,255,.35)"/><stop offset="1" stop-color="rgba(56,224,255,0)"/>
     </linearGradient></defs>
     <polygon points="${area}" fill="url(#g)"/>
     <polyline points="${pts}" fill="none" stroke="#38e0ff" stroke-width="2.5" style="filter:drop-shadow(0 0 6px #38e0ff)"/>`;
  $("pvSummary").textContent=`Portfolio moved from $${fmt(series[0])} to $${fmt(series[series.length-1])} over the year.`;
})();

// ----- allocation bars -----
$("alloc").innerHTML=hunters.map(h=>{const w=Math.round((h.price*10)/portVal*100);
  return `<div class="barlbl"><span>${esc(h.sym)}</span><span>${w}%</span></div>
          <div class="bar"><i style="width:${w}%"></i></div>`;}).join("");

// ----- roster -----
$("roster").innerHTML=hunters.map(h=>{const plw=Math.min(100,Math.round(h.s));
  return `<tr><td><span class="rk ${h.rk}">${h.rk}</span></td>
    <td><b>${esc(h.sym)}</b><div style="color:var(--muted);font-size:11px">${esc(h.name)}</div></td>
    <td><div class="pl"><span>${fmt(h.pw)}</span><span class="mini"><i style="width:${plw}%"></i></span></div></td>
    <td>${h.yield.toFixed(2)}%</td><td>${h.payout}%</td><td>${h.years} yr</td><td>$${h.price??'—'}</td></tr>`;}).join("");

// ----- market cards -----
$("market").innerHTML=hunters.map(h=>{
  const k=h.hist||[]; let spark="";
  if(k.length>1){const W=240,H=54,pad=4,mn=Math.min(...k),mx=Math.max(...k),sp=(mx-mn)||1;
    const pts=k.map((p,i)=>{const x=pad+(W-2*pad)*i/(k.length-1);const y=pad+(H-2*pad)*(1-(p-mn)/sp);
      return x.toFixed(1)+","+y.toFixed(1);}).join(" ");
    const col=k[k.length-1]>=k[0]?"#5ef0b0":"#ff6b8a";
    spark=`<svg viewBox="0 0 240 54" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2"/></svg>`;}
  return `<div class="panel mcard"><div style="display:flex;justify-content:space-between;align-items:center">
     <div><div class="sym">${esc(h.sym)} <span class="rk ${h.rk}" style="font-size:11px">${h.rk}</span></div>
     <div class="nm">${esc(h.name)}</div></div><div style="text-align:right"><b>$${h.price??'—'}</b>
     <div class="nm">${h.yield.toFixed(2)}% yield</div></div></div>${spark}</div>`;}).join("");

// ----- quests (derived from the roster) -----
const lowGuard = hunters.filter(h=>h.payout>90 || h.de>200);
const quests=[
  {t:`Inspect ${hunters[0].sym} — your highest-power hunter`, r:"+120 XP", done:true},
  {t: lowGuard.length?`Audit ${lowGuard.length} over-strained hunter(s) (high payout/debt)`:"No fragile hunters today — patrol the market", r:"+200 XP", done:false},
  {t:"Diversify: keep no single hunter above 20% of the squad", r:"+150 XP", done:false},
  {t:"Daily: log one lesson learned to your memory scroll", r:"+80 XP", done:false},
];
$("quests").innerHTML=quests.map(q=>`<div class="quest ${q.done?'done':''}">
   <span class="chk" aria-hidden="true"></span><div class="q"><div class="ttl">${esc(q.t)}</div>
   <div class="rw">Reward ${q.r}</div></div></div>`).join("");

// ----- nav (accessible view switching) -----
const btns=[...document.querySelectorAll('nav.side button')];
btns.forEach(b=>b.addEventListener('click',()=>{
  btns.forEach(x=>x.removeAttribute('aria-current'));
  b.setAttribute('aria-current','page');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  $("view-"+b.dataset.view).classList.add('active');
}));

// ----- ARISE -----
const toast=$("toast");
$("arise").addEventListener('click',()=>{
  const best=hunters[0];
  toast.textContent=`⚡ Shadow extracted: ${best.sym} joins your army (Rank ${best.rk})`;
  toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2600);
});
</script>
</body>
</html>"""


def main() -> int:
    tickers = [a.upper() for a in sys.argv[1:]] or DEFAULT_TICKERS
    data = {}
    for t in tickers:
        print(f"[dash] fetching {t} ...")
        d = fetch_struct(t)
        if d:
            data[t] = d
    if not data:
        print("[dash] no data — aborting.")
        return 1
    out = TEMPLATE.replace("__DATA__", json.dumps(data))
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"[dash] wrote {path}  ({len(out)} bytes, {len(data)} hunters)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
