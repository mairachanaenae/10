#!/usr/bin/env python3
"""An "advisory board" of legendary investors who mentor you — built on ag2 + Claude.

Instead of two robots solving a coding task, this is a PANEL of investor agents that
talk things through together and teach you. Each agent has the style of a famous
investor; a final "analyst" agent ties their points together into a clear takeaway.

Focus: long-term investing and dividends (picked by the user).

  Buffett  -> wonderful companies, held for the long term, durable advantages
  Munger   -> mental models, inverting problems, avoiding dumb mistakes
  Lynch    -> "invest in what you understand," reasonable price for growth
  Graham   -> margin of safety, the defensive investor, not overpaying
  Historian-> lessons from market history (crashes, bubbles, dividend track records)
  Analyst  -> synthesizes the panel into a plain-English takeaway + caveats

IMPORTANT — read this:
  This is an EDUCATIONAL tool. The agents imitate public investing philosophies to
  teach how thoughtful investors REASON. It is NOT financial advice, and no one can
  reliably predict markets. Nothing here is a promise of returns. Always do your own
  research and consider speaking with a licensed financial advisor before investing
  real money.

Run a self-driving panel discussion (seeded with a beginner question):
    python3 investing_mentors.py

Have a back-and-forth where YOU type questions in the terminal:
    python3 investing_mentors.py --chat

Check the wiring without any network call (no API key needed):
    python3 investing_mentors.py --smoke
"""

from __future__ import annotations

import sys

from autogen import AssistantAgent, GroupChat, GroupChatManager, UserProxyAgent

# Reuse the Claude config + model id from the sibling example.
from autonomous_agent import MODEL, build_llm_config

DISCLAIMER = (
    "EDUCATIONAL ONLY — not financial advice. These are imitations of public investing "
    "philosophies, meant to teach how careful investors think. No one can reliably "
    "predict markets; nothing here guarantees returns. Do your own research and consider "
    "a licensed advisor before investing real money."
)

# A shared rule every mentor follows, so the panel stays honest and useful.
_HOUSE_RULES = (
    " Teach principles and how to reason, not hot tips. Keep it plain and beginner-friendly. "
    "When you discuss a company's future, think in scenarios and always flag the uncertainty — "
    "never promise an outcome. Emphasize long-term holding and dividend safety where relevant. "
    "Keep each turn short (a few sentences)."
)

MENTORS = {
    "Buffett": (
        "You are an investor in the style of Warren Buffett. You favor wonderful businesses "
        "with durable competitive advantages, bought at fair prices and held for the long term. "
        "You love steady, growing dividends backed by real earnings." + _HOUSE_RULES
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
        "patient long-term investors have fared through downturns. You remind the learner that "
        "history rhymes but never repeats exactly, so it informs judgment — it does not predict." + _HOUSE_RULES
    ),
    "Analyst": (
        "You are a clear-headed financial analyst and the panel's facilitator. After the mentors "
        "speak, you synthesize their points into a short, plain-English takeaway for the learner: "
        "the key principles, a simple checklist for judging a long-term dividend stock, and an "
        "honest note on uncertainty and risk. End your synthesis with the word ADJOURN." + _HOUSE_RULES
    ),
}

# The default question the learner 'asks' when running the self-driving demo.
SEED_QUESTION = (
    "I'm a beginner. I want to invest for the long term and earn dividends. "
    "How should I think about picking good companies, and how do I judge whether a "
    "company's dividend is safe and likely to keep growing?"
)


def build_panel(interactive: bool):
    """Create the learner + the mentor agents and wire them into a round-table."""
    llm_config = build_llm_config()

    learner = UserProxyAgent(
        name="Learner",
        human_input_mode="ALWAYS" if interactive else "NEVER",
        max_consecutive_auto_reply=0,        # the learner asks; it doesn't auto-chatter
        code_execution_config=False,          # this panel talks; it doesn't run code
        is_termination_msg=lambda m: "ADJOURN" in (m.get("content") or ""),
    )

    mentors = [
        AssistantAgent(name=name, llm_config=llm_config, system_message=msg)
        for name, msg in MENTORS.items()
    ]

    # Round-robin keeps the order predictable (and avoids an extra LLM call to pick a
    # speaker): each mentor speaks once, the Analyst synthesizes last, then it stops.
    groupchat = GroupChat(
        agents=[learner, *mentors],
        messages=[],
        max_round=len(mentors) + 2,           # one pass through the panel, then stop
        speaker_selection_method="round_robin",
    )
    manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)
    return learner, manager


def smoke_test() -> int:
    """Build the panel and confirm wiring without any API call."""
    learner, manager = build_panel(interactive=False)
    assert learner.name == "Learner"
    assert manager.groupchat is not None
    names = [a.name for a in manager.groupchat.agents]
    print("[smoke] OK: panel constructed, no network call made.")
    print(f"[smoke] model={MODEL}  seats={names}")
    return 0


def main(interactive: bool) -> int:
    print("=" * 78)
    print(DISCLAIMER)
    print("=" * 78)
    learner, manager = build_panel(interactive=interactive)
    # The learner opens the session with the seeded question; the panel takes it from there.
    learner.initiate_chat(manager, message=SEED_QUESTION)
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--smoke" in args:
        raise SystemExit(smoke_test())
    raise SystemExit(main(interactive="--chat" in args))
