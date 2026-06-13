#!/usr/bin/env python3
"""Generate ONE self-contained, very-interactive HTML file for the mentor panel.

It bakes in real numbers + 1y price history for several dividend stocks, then embeds
JavaScript so you can:
  - pick a stock (fills the sliders with its real numbers + draws its price chart), or
  - drag the sliders yourself (yield, payout ratio, debt, years of dividend growth),
and watch a live safety score, an auto-checklist, and the MENTORS react instantly —
approving or warning based on the numbers. No server, no API key, no internet.

    python3 web/build_static.py            # default tickers -> web/mentor_panel.html
    python3 web/build_static.py KO PEP O   # your own tickers
"""

from __future__ import annotations

import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from investing_mentors import DISCLAIMER  # noqa: E402

DEFAULT_TICKERS = ["KO", "PEP", "JNJ", "PG", "O", "MCD", "ABBV", "VZ"]


def fetch_struct(ticker: str) -> dict | None:
    try:
        import yfinance as yf
    except ImportError:
        print("[build] yfinance not installed — run: pip install yfinance")
        return None
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        name = info.get("shortName") or info.get("longName") or ticker
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        dy = info.get("dividendYield")
        payout = info.get("payoutRatio")
        de = info.get("debtToEquity")

        dy_pct = round((dy * 100 if (dy is not None and dy < 1) else (dy or 0)), 2)
        payout_pct = round((payout or 0) * 100)

        years = 0
        try:
            divs = t.dividends
            if divs is not None and len(divs):
                annual = divs.groupby(divs.index.year).sum()
                annual = annual[annual.index < datetime.datetime.now().year]
                vals = [annual[y] for y in sorted(annual.index)]
                streak = 1
                for i in range(len(vals) - 1, 0, -1):
                    if vals[i] >= vals[i - 1] - 1e-9:
                        streak += 1
                    else:
                        break
                years = streak if len(vals) > 1 else 0
        except Exception:
            pass

        hist = []
        try:
            h = t.history(period="1y", interval="1mo")
            hist = [round(float(x), 2) for x in h["Close"].dropna().tolist()]
        except Exception:
            pass

        return {
            "name": name,
            "price": round(float(price), 2) if price else None,
            "yield": dy_pct,
            "payout": payout_pct,
            "de": round(float(de), 1) if de is not None else 100.0,
            "years": int(years),
            "hist": hist,
        }
    except Exception as e:
        print(f"[build] could not fetch {ticker}: {type(e).__name__}: {str(e)[:120]}")
        return None


# The page. JSON is injected via .replace() on __TOKENS__ (no brace-doubling needed).
TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Investing Mentor Panel — interactive</title>
<style>
  :root { --bg:#f4f1ea; --card:#fff; --ink:#222; --muted:#6b6b6b; --accent:#b5651d;
          --good:#2e7d32; --warn:#b26a00; --bad:#c62828; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
         background:var(--bg); color:var(--ink); line-height:1.5; }
  .wrap { max-width:820px; margin:0 auto; padding:24px 16px 72px; }
  h1 { font-family:Georgia,serif; font-size:30px; margin:6px 0 2px; }
  .sub { color:var(--muted); margin:0 0 14px; }
  .disclaimer { background:#fff7e6; border:1px solid #f0d9a8; color:#7a5a12;
                padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:16px; }
  .card { background:var(--card); border:1px solid #e6e1d6; border-radius:14px;
          padding:16px; margin-bottom:16px; }
  .row { display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
  label { font-size:13px; color:var(--muted); display:block; margin-bottom:2px; }
  select { padding:9px 12px; border-radius:8px; border:1px solid #cfc8ba; font-size:15px; }
  .ctrl { flex:1; min-width:180px; }
  input[type=range] { width:100%; accent-color:var(--accent); }
  .val { font-weight:700; }
  .scorewrap { display:flex; align-items:center; gap:16px; }
  .gauge { flex:1; height:18px; background:#eee; border-radius:10px; overflow:hidden; }
  .gauge > div { height:100%; width:0; transition:width .25s, background .25s; }
  .scoreNum { font-family:Georgia,serif; font-size:34px; min-width:120px; text-align:right; }
  .verdict { font-weight:700; }
  ul.checklist { list-style:none; padding:0; margin:8px 0 0; }
  ul.checklist li { padding:3px 0; }
  .bubble { border:1px solid #e6e1d6; border-radius:14px; padding:10px 14px; margin:8px 0;
            display:flex; gap:12px; align-items:flex-start; background:#fff; }
  .bubble .who { font-size:22px; }
  .bubble .name { font-weight:700; margin-bottom:1px; }
  .tag { font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; margin-left:8px; }
  .tag.good { background:#e6f4e6; color:var(--good); }
  .tag.warn { background:#fdf0dc; color:var(--warn); }
  .tag.bad  { background:#fce8e8; color:var(--bad); }
  svg.spark { width:100%; height:90px; }
  .foot { color:var(--muted); font-size:12px; margin-top:20px; }
  .price { font-family:Georgia,serif; font-size:22px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>📈 Investing Mentor Panel</h1>
  <p class="sub">Pick a stock or move the sliders — the mentors react live. Long-term &amp; dividends.</p>
  <div class="disclaimer">__DISCLAIMER__</div>

  <div class="card">
    <div class="row">
      <div>
        <label>Stock (fills the sliders with real numbers)</label>
        <select id="preset"></select>
      </div>
      <div class="ctrl">
        <label>Your risk comfort: <span id="riskLbl" class="val">Balanced</span></label>
        <input type="range" id="risk" min="0" max="100" value="50">
      </div>
    </div>
    <div id="priceLine" class="price" style="margin-top:10px"></div>
    <svg class="spark" id="spark" viewBox="0 0 600 90" preserveAspectRatio="none"></svg>
  </div>

  <div class="card">
    <div class="row">
      <div class="ctrl"><label>Dividend yield: <span id="yLbl" class="val"></span></label>
        <input type="range" id="yield" min="0" max="15" step="0.1"></div>
      <div class="ctrl"><label>Payout ratio: <span id="pLbl" class="val"></span></label>
        <input type="range" id="payout" min="0" max="150" step="1"></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div class="ctrl"><label>Debt-to-equity: <span id="dLbl" class="val"></span></label>
        <input type="range" id="de" min="0" max="400" step="1"></div>
      <div class="ctrl"><label>Years of dividend growth: <span id="gLbl" class="val"></span></label>
        <input type="range" id="years" min="0" max="70" step="1"></div>
    </div>
  </div>

  <div class="card">
    <div class="scorewrap">
      <div style="flex:1">
        <div>Dividend-safety score &nbsp;<span id="verdict" class="verdict"></span></div>
        <div class="gauge"><div id="bar"></div></div>
      </div>
      <div id="score" class="scoreNum"></div>
    </div>
    <ul class="checklist" id="checklist"></ul>
  </div>

  <div id="panel"></div>

  <p class="foot">Educational only — not financial advice. Numbers are a point-in-time snapshot
     from when this file was built. Built with ag2 + Claude.</p>
</div>

<script>
const DATA = __DATA__;

function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function $(id){return document.getElementById(id);}

// ---- scoring (transparent, educational) ----
function score(v){
  let s=0;
  s += v.payout<=40?30 : v.payout<=60?24 : v.payout<=75?15 : v.payout<=90?6 : 0;     // covered?
  s += v.de<=50?25 : v.de<=100?18 : v.de<=150?10 : v.de<=250?4 : 0;                  // debt
  s += v.years>=25?25 : v.years>=10?18 : v.years>=5?10 : v.years>=1?4 : 0;           // record
  s += v.yield<=5?20 : v.yield<=7?12 : v.yield<=10?5 : 0;                            // yield-trap
  return Math.round(s);
}
function verdict(s, risk){
  // a cautious user (risk low) demands a higher score for the same label
  const bump = (50 - risk)/5;            // -10..+10
  const sturdy = 70 + bump, okay = 45 + bump;
  if (s >= sturdy) return ["Sturdy","var(--good)","good"];
  if (s >= okay)   return ["Okay","var(--warn)","warn"];
  return ["Fragile","var(--bad)","bad"];
}

// ---- the mentors react to the numbers ----
function reactions(v, s){
  const out=[];
  const add=(emoji,name,text,tag)=>out.push({emoji,name,text,tag});

  add("💰","Buffett",
    (v.payout<=60 && v.years>=10) ? "Earnings comfortably cover a long-rising dividend — the durable kind I like to own for years." :
    (v.payout>90) ? "The payout leaves almost no cushion. I'd want earnings to cover it with room to spare." :
    "Decent, but I'd study whether the moat protects these earnings over a decade.",
    (v.payout<=60 && v.years>=10) ? "good" : (v.payout>90?"bad":"warn"));

  add("🧠","Munger",
    (v.de>150 || v.payout>90) ? "Invert it: high debt and a stretched payout are exactly what snaps a dividend. Avoid that combination." :
    "Few obvious ways this breaks — low-ish debt and a sane payout. That's the boring good kind.",
    (v.de>150 || v.payout>90) ? "bad":"good");

  add("🛒","Lynch",
    (v.yield>8) ? "A yield that high usually means the market is pricing in a cut. Be careful chasing it." :
    "Understandable and steady — just make sure you're not overpaying for it.",
    (v.yield>8) ? "warn":"good");

  add("🛡️","Graham",
    (v.years>=20) ? "A long, unbroken record — the defensive investor's friend." :
    (v.years<5)   ? "Too short a record to lean on yet; demand more history or a bigger margin of safety." :
    "A fair record. Insist on not overpaying versus its value.",
    (v.years>=20)?"good":(v.years<5?"warn":"warn"));

  add("📜","Historian",
    (v.de>150 && v.payout>80) ? "This rhymes with payers that cut in 2008 — high debt heading into a downturn." :
    (v.years>=25) ? "A multi-decade raiser; history has favored these through recessions — though history never promises." :
    "History says steady demand + low debt is what survives bad years. Watch those.",
    (v.de>150 && v.payout>80)?"bad":(v.years>=25?"good":"warn"));

  add("⚠️","Risk",
    (v.yield>8) ? "That yield smells like a trap. If you buy at all, size it very small." :
    (v.de>250)  ? "Debt is heavy — a downturn could force a dividend cut. Keep the position small." :
    "Whatever you decide, diversify and size it small so one mistake can't sink you.",
    (v.yield>8 || v.de>250)?"bad":"warn");

  const top = (v.payout>90?"the stretched payout":v.de>200?"the heavy debt":v.yield>8?"the very high yield":v.years<5?"the short track record":"no single red flag");
  add("📊","Analyst",
    "Score "+s+"/100. Biggest watch-item: "+top+". This stacks the odds; it never guarantees the future. Make it one holding among many.",
    s>=70?"good":s>=45?"warn":"bad");
  return out;
}

function sparkline(hist){
  if(!hist || hist.length<2){ $("spark").innerHTML=""; return; }
  const W=600,H=90,pad=6;
  const min=Math.min(...hist), max=Math.max(...hist), span=(max-min)||1;
  const pts=hist.map((p,i)=>{
    const x=pad+(W-2*pad)*i/(hist.length-1);
    const y=pad+(H-2*pad)*(1-(p-min)/span);
    return x.toFixed(1)+","+y.toFixed(1);
  }).join(" ");
  const up = hist[hist.length-1]>=hist[0];
  const col = up ? "var(--good)":"var(--bad)";
  $("spark").innerHTML='<polyline fill="none" stroke="'+col+'" stroke-width="2.5" points="'+pts+'"/>';
}

let CUR=null; // current stock (for price/chart)

function readInputs(){
  return {
    yield:parseFloat($("yield").value),
    payout:parseFloat($("payout").value),
    de:parseFloat($("de").value),
    years:parseInt($("years").value),
  };
}

function refresh(){
  const v=readInputs(), risk=parseInt($("risk").value);
  $("yLbl").textContent=v.yield.toFixed(1)+"%";
  $("pLbl").textContent=v.payout+"%";
  $("dLbl").textContent=v.de;
  $("gLbl").textContent=v.years+" yrs";
  $("riskLbl").textContent = risk<34?"Cautious":risk>66?"Bold":"Balanced";

  const s=score(v); const [label,col,cls]=verdict(s,risk);
  $("score").textContent=s; $("score").style.color=col;
  $("verdict").textContent="— "+label; $("verdict").style.color=col;
  $("bar").style.width=s+"%"; $("bar").style.background=col;

  $("checklist").innerHTML = [
    [v.payout<=60,"Payout ratio leaves a cushion (≤60%)"],
    [v.de<=100,"Debt is moderate (debt-to-equity ≤100)"],
    [v.years>=10,"Long record of raising the dividend (≥10 yrs)"],
    [v.yield<=7,"Yield isn't a warning sign (≤7%)"],
  ].map(([ok,t])=>"<li>"+(ok?"✅ ":"❌ ")+esc(t)+"</li>").join("");

  $("panel").innerHTML = reactions(v,s).map(r=>
    '<div class="bubble"><div class="who">'+r.emoji+'</div><div style="flex:1">'
    +'<div class="name">'+esc(r.name)+'<span class="tag '+r.tag+'">'
    +(r.tag==="good"?"approves":r.tag==="bad"?"warns":"caution")+'</span></div>'
    +'<div>'+esc(r.text)+'</div></div></div>').join("");
}

function applyPreset(t){
  const d=DATA[t]; CUR=d;
  if(!d){ $("priceLine").textContent=""; sparkline(null); return; }
  $("yield").value=d.yield; $("payout").value=d.payout; $("de").value=d.de; $("years").value=d.years;
  $("priceLine").textContent = d.name+"  ·  $"+(d.price??"n/a");
  sparkline(d.hist);
  refresh();
}

// wire up
const presetSel=$("preset");
for(const k of Object.keys(DATA)) presetSel.add(new Option(DATA[k].name+" ("+k+")",k));
presetSel.onchange=()=>applyPreset(presetSel.value);
["yield","payout","de","years","risk"].forEach(id=>$(id).oninput=refresh);
applyPreset(Object.keys(DATA)[0]);
</script>
</body>
</html>"""


def main() -> int:
    tickers = [a.upper() for a in sys.argv[1:]] or DEFAULT_TICKERS
    data = {}
    for t in tickers:
        print(f"[build] fetching {t} ...")
        d = fetch_struct(t)
        if d:
            data[t] = d
        else:
            print(f"[build] skipped {t}")
    if not data:
        print("[build] no data — aborting.")
        return 1

    out = (TEMPLATE
           .replace("__DISCLAIMER__", DISCLAIMER)
           .replace("__DATA__", json.dumps(data)))
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mentor_panel.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"[build] wrote {path}  ({len(out)} bytes, {len(data)} stocks)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
