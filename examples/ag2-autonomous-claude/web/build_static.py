#!/usr/bin/env python3
"""Generate a single self-contained interactive HTML file for the mentor panel.

Bakes in real numbers (fetched now) for several dividend stocks plus the canned,
in-character mentor replies, then writes one .html file with embedded JavaScript so the
dropdown + button work offline — no server, no API key, no internet.

    python3 web/build_static.py            # writes web/mentor_panel.html (default tickers)
    python3 web/build_static.py KO PEP O   # choose your own tickers
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from investing_mentors import DEMO_REPLIES, DISCLAIMER, MENTORS, SEED_QUESTION, fetch_stock_facts

DEFAULT_TICKERS = ["KO", "PEP", "JNJ", "PG", "O", "MCD", "ABBV", "VZ"]
EMOJI = {
    "Learner": "🧑‍🎓", "Buffett": "💰", "Munger": "🧠", "Lynch": "🛒",
    "Graham": "🛡️", "Historian": "📜", "Risk": "⚠️", "Analyst": "📊",
}

HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Investing Mentor Panel</title>
<style>
  :root {{ --bg:#f4f1ea; --card:#fff; --ink:#222; --muted:#6b6b6b; --accent:#b5651d; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
          background:var(--bg); color:var(--ink); line-height:1.5; }}
  .wrap {{ max-width:760px; margin:0 auto; padding:24px 16px 64px; }}
  h1 {{ font-family:Georgia,serif; font-size:30px; margin:8px 0 4px; }}
  .sub {{ color:var(--muted); margin:0 0 16px; }}
  .disclaimer {{ background:#fff7e6; border:1px solid #f0d9a8; color:#7a5a12;
                 padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:18px; }}
  .controls {{ background:var(--card); border:1px solid #e6e1d6; border-radius:12px;
               padding:14px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }}
  select, button {{ padding:10px 14px; border-radius:8px; border:1px solid #cfc8ba; font-size:15px; }}
  button {{ background:var(--accent); color:#fff; border:none; cursor:pointer; font-weight:600; }}
  .facts {{ background:#eef4ee; border:1px solid #cfe0cf; border-radius:10px; padding:12px 14px;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; white-space:pre-wrap;
            margin-bottom:18px; }}
  .bubble {{ background:var(--card); border:1px solid #e6e1d6; border-radius:14px; padding:12px 14px;
             margin:10px 0; display:flex; gap:12px; }}
  .bubble.you {{ background:#eef1f6; }}
  .who {{ font-size:24px; line-height:1; }}
  .name {{ font-weight:700; margin-bottom:2px; }}
  .foot {{ color:var(--muted); font-size:12px; margin-top:24px; }}
</style>
</head>
<body>
<div class="wrap">
  <h1>📈 Investing Mentor Panel</h1>
  <p class="sub">A round-table of legendary investors who teach you — long-term &amp; dividends.</p>
  <div class="disclaimer">{disclaimer}</div>

  <div class="controls">
    <select id="ticker"></select>
    <button onclick="render()">Ask the panel</button>
  </div>

  <div id="facts" class="facts"></div>
  <div id="panel"></div>

  <p class="foot">Educational only — not financial advice. Offline interactive demo
     (real numbers fetched when this file was built). Built with ag2 + Claude.</p>
</div>

<script>
const DATA = {data_json};
const MENTORS = {mentors_json};
const SEED = {seed_json};

function esc(s) {{
  return String(s).replace(/[&<>]/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;'}}[c]));
}}

function render() {{
  const t = document.getElementById('ticker').value;
  const facts = DATA[t] ? DATA[t].facts : "";
  const opener = DATA[t]
    ? facts + "\\n\\nUsing these numbers and market history, is this a solid long-term dividend holding?"
    : SEED;
  document.getElementById('facts').style.display = DATA[t] ? 'block' : 'none';
  document.getElementById('facts').textContent = facts;

  let html = bubble('🧑‍🎓', 'You', opener, true);
  for (const m of MENTORS) html += bubble(m.emoji, m.name, m.text, false);
  document.getElementById('panel').innerHTML = html;
}}

function bubble(emoji, name, text, you) {{
  return '<div class="bubble' + (you ? ' you' : '') + '">'
       + '<div class="who">' + emoji + '</div>'
       + '<div><div class="name">' + esc(name) + '</div><div>' + esc(text) + '</div></div></div>';
}}

// Populate the dropdown and show an initial session.
const sel = document.getElementById('ticker');
sel.add(new Option('(no specific stock)', ''));
for (const k of Object.keys(DATA)) sel.add(new Option(DATA[k].name + ' (' + k + ')', k));
sel.value = Object.keys(DATA)[0] || '';
render();
</script>
</body>
</html>"""


def main() -> int:
    tickers = [a.upper() for a in sys.argv[1:]] or DEFAULT_TICKERS
    data = {}
    for t in tickers:
        print(f"[build] fetching {t} ...")
        facts = fetch_stock_facts(t)
        if not facts:
            print(f"[build] skipped {t} (no data)")
            continue
        # First line is "Real numbers for <Name> (TICKER), ...": pull the name out for the menu.
        name = facts.split(" for ", 1)[-1].split(" (", 1)[0] if " for " in facts else t
        data[t] = {"name": name, "facts": facts}

    if not data:
        print("[build] no data fetched — aborting.")
        return 1

    mentors = [{"name": n, "emoji": EMOJI.get(n, "💬"), "text": DEMO_REPLIES[n]} for n in MENTORS]
    out = HTML.format(
        disclaimer=DISCLAIMER,
        data_json=json.dumps(data),
        mentors_json=json.dumps(mentors),
        seed_json=json.dumps(SEED_QUESTION),
    )
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mentor_panel.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"[build] wrote {path}  ({len(out)} bytes, {len(data)} stocks)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
