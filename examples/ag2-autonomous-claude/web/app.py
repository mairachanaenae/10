#!/usr/bin/env python3
"""A tiny web page for the investing mentor panel.

Run it:
    pip install flask
    python3 web/app.py
    # then open http://127.0.0.1:5000 in your browser

Modes:
  - "demo"  works with NO API key and NO network for the commentary (canned, in-character
            mentor replies). If you enter a ticker, real live numbers are still fetched.
  - "live"  uses Claude to generate fresh mentor replies (needs ANTHROPIC_API_KEY).
"""

from __future__ import annotations

import os
import sys

from flask import Flask, render_template_string, request

# Make the sibling investing_mentors module importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from investing_mentors import (  # noqa: E402
    DEMO_REPLIES,
    DISCLAIMER,
    MENTORS,
    SEED_QUESTION,
    build_panel,
    fetch_stock_facts,
)

EMOJI = {
    "Learner": "🧑‍🎓",
    "Buffett": "💰",
    "Munger": "🧠",
    "Lynch": "🛒",
    "Graham": "🛡️",
    "Historian": "📜",
    "Risk": "⚠️",
    "Analyst": "📊",
}

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Investing Mentor Panel</title>
<style>
  :root { --bg:#f4f1ea; --card:#fff; --ink:#222; --muted:#6b6b6b; --accent:#b5651d; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
         background:var(--bg); color:var(--ink); line-height:1.5; }
  .wrap { max-width:760px; margin:0 auto; padding:24px 16px 64px; }
  h1 { font-family:Georgia,serif; font-size:30px; margin:8px 0 4px; }
  .sub { color:var(--muted); margin:0 0 16px; }
  .disclaimer { background:#fff7e6; border:1px solid #f0d9a8; color:#7a5a12;
                padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:18px; }
  form { background:var(--card); border:1px solid #e6e1d6; border-radius:12px;
         padding:14px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  input[type=text] { flex:1; min-width:160px; padding:10px 12px; border:1px solid #cfc8ba;
                     border-radius:8px; font-size:15px; }
  select, button { padding:10px 14px; border-radius:8px; border:1px solid #cfc8ba; font-size:15px; }
  button { background:var(--accent); color:#fff; border:none; cursor:pointer; font-weight:600; }
  .facts { background:#eef4ee; border:1px solid #cfe0cf; border-radius:10px; padding:12px 14px;
           font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; white-space:pre-wrap;
           margin-bottom:18px; }
  .bubble { background:var(--card); border:1px solid #e6e1d6; border-radius:14px; padding:12px 14px;
            margin:10px 0; display:flex; gap:12px; }
  .who { font-size:24px; line-height:1; }
  .name { font-weight:700; margin-bottom:2px; }
  .you .who { } .you { background:#eef1f6; }
  .foot { color:var(--muted); font-size:12px; margin-top:24px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>📈 Investing Mentor Panel</h1>
  <p class="sub">A round-table of legendary investors who teach you — long-term &amp; dividends.</p>
  <div class="disclaimer">{{ disclaimer }}</div>

  <form method="post">
    <input type="text" name="ticker" placeholder="Stock symbol (optional), e.g. KO" value="{{ ticker }}">
    <select name="mode">
      <option value="demo" {{ 'selected' if mode=='demo' else '' }}>Demo (no key)</option>
      <option value="live" {{ 'selected' if mode=='live' else '' }}>Live (needs API key)</option>
    </select>
    <input type="text" name="question" style="flex:1 1 100%;" placeholder="Ask your own question (live mode answers it for real), e.g. 'Is this dividend safe?'" value="{{ question }}">
    <button type="submit">Ask the panel</button>
  </form>

  {% if facts %}<div class="facts">{{ facts }}</div>{% endif %}
  {% if error %}<div class="disclaimer">⚠️ {{ error }}</div>{% endif %}

  {% for who, emoji, text, is_you in bubbles %}
    <div class="bubble {{ 'you' if is_you else '' }}">
      <div class="who">{{ emoji }}</div>
      <div><div class="name">{{ who }}</div><div>{{ text }}</div></div>
    </div>
  {% endfor %}

  <p class="foot">Educational only — not financial advice. Built with ag2 + Claude.</p>
</div>
</body>
</html>"""

app = Flask(__name__)


def build_bubbles(ticker: str, mode: str, question: str = ""):
    """Return (facts_text, bubbles, error). bubbles = [(name, emoji, text, is_learner)]."""
    facts_text = fetch_stock_facts(ticker) if ticker else None
    ask = (question or "").strip()
    if ask:
        # Your own question drives the panel; real numbers are added as context if present.
        opener = (facts_text + "\n\n" + ask) if facts_text else ask
    elif ticker:
        opener = (
            (facts_text or f"(could not fetch live data for {ticker.upper()})")
            + "\n\nUsing these numbers and market history, is this a solid long-term dividend holding?"
        )
    else:
        opener = SEED_QUESTION

    bubbles = [("Learner", EMOJI["Learner"], opener, True)]
    error = None

    if mode == "live":
        try:
            learner, manager = build_panel(interactive=False, demo=False)
            learner.initiate_chat(manager, message=opener)
            for m in manager.groupchat.messages[1:]:  # skip the learner's opener (already shown)
                name = m.get("name") or m.get("role") or "?"
                bubbles.append((name, EMOJI.get(name, "💬"), m.get("content") or "", False))
        except Exception as e:  # most commonly: no/invalid ANTHROPIC_API_KEY
            error = f"Live mode failed ({type(e).__name__}). Set ANTHROPIC_API_KEY, or use Demo mode."
    else:
        for name in MENTORS:  # deterministic canned panel — no key, no network
            bubbles.append((name, EMOJI.get(name, "💬"), DEMO_REPLIES[name], False))

    return facts_text, bubbles, error


def render(ticker: str, mode: str, question: str = "") -> str:
    facts_text, bubbles, error = build_bubbles(ticker, mode, question)
    return render_template_string(
        PAGE, disclaimer=DISCLAIMER, ticker=ticker, mode=mode, question=question,
        facts=facts_text, bubbles=bubbles, error=error,
    )


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        ticker = (request.form.get("ticker") or "").strip()
        mode = request.form.get("mode", "demo")
        question = (request.form.get("question") or "").strip()
        return render(ticker, mode, question)
    # First load: show a demo session so the page is never empty.
    return render("", "demo")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
