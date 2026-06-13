#!/usr/bin/env python3
"""An "advisory board" of legendary investors who mentor you — built on ag2 + Claude.

A PANEL of investor agents talks things through and teaches you. Each has the style of a
famous investor; a historian adds lessons from market history; a risk officer guards your
downside; and an analyst ties it together into a plain-English takeaway.

Focus: long-term investing and dividends.

  Buffett  -> wonderful companies, held for the long term, durable advantages
  Munger   -> mental models, inverting problems, avoiding dumb mistakes
  Lynch    -> "invest in what you understand," a reasonable price for growth
  Graham   -> margin of safety, the defensive investor, not overpaying
  Historian-> lessons from market history (crashes, bubbles, dividend track records)
  Risk     -> protecting you: diversification, position sizing, what could go wrong
  Analyst  -> synthesizes the panel into a plain-English takeaway + caveats

IMPORTANT — read this:
  EDUCATIONAL tool. The agents imitate public investing philosophies to teach how
  thoughtful investors REASON. It is NOT financial advice, and no one can reliably predict
  markets. Nothing here promises returns. Do your own research and consider a licensed
  financial advisor before investing real money.

Examples:
    python3 investing_mentors.py                 # self-driving panel, seeded question
    python3 investing_mentors.py --ticker KO     # analyze REAL numbers for a stock
    python3 investing_mentors.py --chat          # you type questions; 3-question intake
    python3 investing_mentors.py --demo          # offline canned run — no key, no network
    python3 investing_mentors.py --smoke         # check wiring only
"""

from __future__ import annotations

import argparse
import datetime

from autogen import AssistantAgent, GroupChat, GroupChatManager, UserProxyAgent

from autonomous_agent import MODEL, build_llm_config

DISCLAIMER = (
    "EDUCATIONAL ONLY — not financial advice. These are imitations of public investing "
    "philosophies, meant to teach how careful investors think. No one can reliably predict "
    "markets; nothing here guarantees returns. Do your own research and consider a licensed "
    "advisor before investing real money."
)

_HOUSE_RULES = (
    " Teach principles and how to reason, not hot tips. Keep it plain and beginner-friendly. "
    "When you discuss a company's future, think in scenarios and always flag the uncertainty — "
    "never promise an outcome. Emphasize long-term holding and dividend safety where relevant. "
    "If real numbers are provided, reason about them specifically. Keep each turn short "
    "(a few sentences)."
)

MENTORS = {
    "Buffett": (
        "You are an investor in the style of Warren Buffett. You favor wonderful businesses with "
        "durable competitive advantages, bought at fair prices and held for the long term. You "
        "love steady, growing dividends backed by real earnings." + _HOUSE_RULES
    ),
    "Munger": (
        "You are an investor in the style of Charlie Munger. You use mental models from many "
        "fields, you invert problems ('what would guarantee failure?'), and you stress avoiding "
        "obvious mistakes and staying within your circle of competence." + _HOUSE_RULES
    ),
    "Lynch": (
        "You are an investor in the style of Peter Lynch. You tell people to invest in what they "
        "understand, watch a company's everyday products, and pay a reasonable price for steady "
        "growth. You explain things with simple, real-world examples." + _HOUSE_RULES
    ),
    "Graham": (
        "You are an investor in the style of Benjamin Graham, the 'father of value investing'. "
        "You insist on a margin of safety, you separate price from value, and you coach the "
        "'defensive investor' to avoid overpaying and to check a dividend's track record." + _HOUSE_RULES
    ),
    "Historian": (
        "You are a financial historian. You bring lessons from market history — past booms and "
        "busts (the 1929 crash, the Nifty Fifty, the 2000 dot-com bubble, 2008), and the long "
        "track records of steady dividend payers. You use history for perspective and caution: "
        "what has tended to happen to wildly overpriced markets, why dividends get cut, and how "
        "patient long-term investors have fared through downturns. History rhymes but never "
        "repeats exactly, so it informs judgment — it does not predict." + _HOUSE_RULES
    ),
    "Risk": (
        "You are the panel's risk officer. Your only job is protecting the learner from avoidable "
        "harm: don't put too much in any one stock (position sizing), diversify, keep an emergency "
        "fund, beware concentration and chasing yield, and name what could go wrong — including a "
        "dividend cut. You are the calm voice that asks 'what if we're wrong?'" + _HOUSE_RULES
    ),
    "Analyst": (
        "You are a clear-headed financial analyst and the panel's facilitator. After the others "
        "speak, you synthesize their points into a short, plain-English takeaway for the learner: "
        "the key principles, a simple checklist for judging a long-term dividend stock, and an "
        "honest note on uncertainty and risk. End your synthesis with the word ADJOURN." + _HOUSE_RULES
    ),
}

# Canned, in-character lines used only in --demo mode (no LLM, no network).
DEMO_REPLIES = {
    "Buffett": "Buy a business you'd be happy to own if the market closed for ten years. For dividends, I want earnings that comfortably cover the payout and a moat that protects them.",
    "Munger": "Invert it: what makes a dividend unsafe? Too much debt, a payout ratio near 100%, and a fragile business. Avoid those and you've avoided most of the trouble.",
    "Lynch": "Start with what you use every day. If a company sells something people keep buying in good times and bad, its dividend has a fighting chance. Don't overpay for it, though.",
    "Graham": "Demand a margin of safety. Check that the dividend has been paid and raised for many years, and that price hasn't run far ahead of value. Boring and durable beats exciting and fragile.",
    "Historian": "History's lesson: dividends get cut when debt is high and a recession hits — see 2008 banks. The payers that kept raising for decades shared low debt and steady demand. It rhymes; it doesn't promise.",
    "Risk": "Protect yourself: no single stock should sink your plan, so diversify and size positions small. A very high yield is often a warning, not a gift. Keep an emergency fund so you never sell in a panic.",
    "Analyst": (
        "Takeaway — a simple dividend checklist: (1) a business you understand with durable demand; "
        "(2) a payout ratio well under 100%; (3) low debt and steady cash flow; (4) a long history "
        "of paying and raising; (5) a fair price, not a stretched one; (6) it's one of many holdings, "
        "not your whole basket. None of this guarantees the future — it just stacks the odds. ADJOURN"
    ),
}

SEED_QUESTION = (
    "I'm a beginner. I want to invest for the long term and earn dividends. "
    "How should I think about picking good companies, and how do I judge whether a "
    "company's dividend is safe and likely to keep growing?"
)

# Illustrative numbers for --demo so it runs fully offline (clearly labelled).
DEMO_FACTS = (
    "Real numbers (ILLUSTRATIVE DEMO DATA, not live):\n"
    "  Company: The Coca-Cola Company (KO)\n"
    "  Price: $60.00 | Dividend yield: ~3.0% | Payout ratio: ~68%\n"
    "  Dividend history: increased every year for 60+ years (a 'Dividend King')\n"
)


# --------------------------------------------------------------------------- data

def fetch_stock_facts(ticker: str) -> str | None:
    """Look up real numbers for a ticker via yfinance. Returns a formatted block, or None.

    Deterministic data fetch (not an LLM tool call) so the panel reasons about real figures
    without fragile tool-routing through the group chat.
    """
    try:
        import yfinance as yf
    except ImportError:
        print("[data] yfinance not installed — run: pip install yfinance")
        return None
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        name = info.get("shortName") or info.get("longName") or ticker
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        dy = info.get("dividendYield")
        payout = info.get("payoutRatio")
        de = info.get("debtToEquity")

        dy_pct = None
        if dy is not None:
            dy_pct = dy * 100 if dy < 1 else dy  # yfinance returns either fraction or percent

        # Count trailing years of non-decreasing annual dividends (exclude the partial current year).
        growth_years = None
        try:
            divs = t.dividends
            if divs is not None and len(divs):
                annual = divs.groupby(divs.index.year).sum()
                this_year = datetime.datetime.now().year
                annual = annual[annual.index < this_year]
                vals = [annual[y] for y in sorted(annual.index)]
                streak = 1
                for i in range(len(vals) - 1, 0, -1):
                    if vals[i] >= vals[i - 1] - 1e-9:
                        streak += 1
                    else:
                        break
                growth_years = streak if len(vals) > 1 else None
        except Exception:
            pass

        def fmt(v, suffix=""):
            return f"{v}{suffix}" if v is not None else "n/a"

        lines = [
            f"Real numbers for {name} ({ticker.upper()}), fetched live:",
            f"  Price: {fmt(price, '')}",
            f"  Dividend yield: {f'{dy_pct:.2f}%' if dy_pct is not None else 'n/a'}",
            f"  Payout ratio: {f'{payout*100:.0f}%' if payout is not None else 'n/a'}",
            f"  Debt-to-equity: {fmt(de)}",
            f"  Years of non-decreasing dividends (approx): {fmt(growth_years)}",
            "  (Live market data; figures move and may be imperfect. Verify before acting.)",
        ]
        return "\n".join(lines)
    except Exception as e:  # network blocked, bad ticker, schema change, etc.
        print(f"[data] could not fetch {ticker}: {type(e).__name__}: {str(e)[:160]}")
        return None


# --------------------------------------------------------------------------- intake

def run_intake(interactive: bool) -> str:
    """Collect a short investor profile so the mentoring is tailored. Returns a text block."""
    defaults = {
        "timeline": "10+ years",
        "amount": "small, regular monthly contributions",
        "risk": "moderate — prefers steady dividends over big swings",
    }
    if not interactive:
        p = defaults
    else:
        print("\nQuick intake (press Enter to accept the default):")
        def ask(label, key):
            ans = input(f"  {label} [{defaults[key]}]: ").strip()
            return ans or defaults[key]
        p = {
            "timeline": ask("How long until you'd need this money?", "timeline"),
            "amount": ask("Roughly how much / how often are you investing?", "amount"),
            "risk": ask("How do you feel about risk?", "risk"),
        }
    return (
        "About the learner — tailor your guidance to this:\n"
        f"  Timeline: {p['timeline']}\n"
        f"  Investing: {p['amount']}\n"
        f"  Risk comfort: {p['risk']}\n"
    )


# --------------------------------------------------------------------------- panel

def build_panel(interactive: bool, demo: bool):
    """Create the learner + mentors and wire them into a round-table.

    In demo mode each mentor returns a canned line (no LLM, no key), but the real ag2
    GroupChat machinery still runs — so you see an authentic panel flow offline.
    """
    llm_config = False if demo else build_llm_config()

    learner = UserProxyAgent(
        name="Learner",
        human_input_mode="ALWAYS" if interactive else "NEVER",
        max_consecutive_auto_reply=0,
        code_execution_config=False,
        is_termination_msg=lambda m: "ADJOURN" in (m.get("content") or ""),
    )

    mentors = []
    for name, msg in MENTORS.items():
        agent = AssistantAgent(name=name, llm_config=llm_config, system_message=msg)
        if demo:
            # Register a canned reply at the front of the reply chain so no LLM is called.
            canned = DEMO_REPLIES[name]
            agent.register_reply(
                lambda sender: True,  # trigger on any sender
                lambda recipient, messages, sender, config, _t=canned: (True, _t),
                position=0,
            )
        mentors.append(agent)

    groupchat = GroupChat(
        agents=[learner, *mentors],
        messages=[],
        max_round=len(mentors) + 2,           # one pass through the panel, then stop
        speaker_selection_method="round_robin",
    )
    manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)
    return learner, manager


def compose_message(profile_text: str, facts_text: str | None) -> str:
    parts = [profile_text]
    if facts_text:
        parts.append(facts_text)
        parts.append(
            "Using these real numbers and the lessons of market history, discuss whether this "
            "looks like a solid long-term dividend holding — reason in scenarios, flag the "
            "uncertainty, and don't promise an outcome."
        )
    else:
        parts.append(SEED_QUESTION)
    return "\n\n".join(parts)


def smoke_test() -> int:
    learner, manager = build_panel(interactive=False, demo=False)
    names = [a.name for a in manager.groupchat.agents]
    print("[smoke] OK: panel constructed, no network call made.")
    print(f"[smoke] model={MODEL}  seats={names}")
    return 0


def main(args) -> int:
    print("=" * 78)
    print(DISCLAIMER)
    print("=" * 78)

    profile_text = run_intake(interactive=args.chat and not args.demo)

    if args.demo:
        facts_text = DEMO_FACTS if (args.ticker or "").upper() in ("", "KO") else None
    elif args.ticker:
        facts_text = fetch_stock_facts(args.ticker)
    else:
        facts_text = None

    message = compose_message(profile_text, facts_text)
    learner, manager = build_panel(interactive=args.chat and not args.demo, demo=args.demo)
    learner.initiate_chat(manager, message=message)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Investing mentor panel (ag2 + Claude).")
    parser.add_argument("--ticker", help="Stock symbol to analyze with REAL numbers, e.g. KO")
    parser.add_argument("--chat", action="store_true", help="Interactive: 3-question intake + you type questions")
    parser.add_argument("--demo", action="store_true", help="Offline canned run — no API key, no network")
    parser.add_argument("--smoke", action="store_true", help="Check wiring only; no network")
    args = parser.parse_args()

    if args.smoke:
        raise SystemExit(smoke_test())
    raise SystemExit(main(args))
