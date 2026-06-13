#!/usr/bin/env python3
"""Minimal autonomous multi-agent loop with ag2 (AutoGen), pointed at Claude.

An "autonomous agent" is just a loop that picks its own next action, executes it,
sees the result, and stops on a termination condition. ag2 expresses that as TWO
agents talking to each other until a stop signal:

  - assistant (the brain)  -> proposes the next move as a Python code block
  - executor  (the hands)  -> runs that code in the sandbox and feeds the result back

The four parts of the loop, mapped to the code below:
  * Action      -> code_execution_config (the executor can run Python)
  * Feedback    -> the executor returns stdout/stderr to the assistant each turn
  * Termination -> is_termination_msg ("TERMINATE") + max_consecutive_auto_reply (hard cap)
  * Autonomy    -> human_input_mode="NEVER" (no human turn drives the loop)

Run live (uses the Claude config below):
    python3 autonomous_agent.py

Validate wiring without any network call (no API key needed):
    python3 autonomous_agent.py --smoke
"""

from __future__ import annotations

import os
import sys

from autogen import AssistantAgent, UserProxyAgent

MODEL = "claude-opus-4-8"

# A concrete, verifiable task — the file it writes is easy to check afterwards.
TASK = (
    "Compute all prime numbers below 100 and write them, comma-separated on a "
    "single line, to the file 'primes.txt' in the current working directory. "
    "Then print the contents of the file. When the file is written and printed, "
    "reply with the single word TERMINATE."
)


def build_llm_config() -> dict:
    """Claude config, written to work through the container's Anthropic gateway.

    The ag2 AnthropicClient reads ANTHROPIC_API_KEY from the env but does NOT read
    ANTHROPIC_BASE_URL, so base_url is passed explicitly. If no key is set we pass a
    placeholder: a gateway that injects real auth ignores it; a direct api.anthropic.com
    call would (correctly) reject it.
    """
    api_key = (
        os.environ.get("ANTHROPIC_AUTH_TOKEN")
        or os.environ.get("ANTHROPIC_API_KEY")
        or "gateway-placeholder"
    )
    cfg: dict = {
        "api_type": "anthropic",
        "model": MODEL,
        "api_key": api_key,
        "max_tokens": 4096,
    }
    base_url = os.environ.get("ANTHROPIC_BASE_URL")
    if base_url:
        cfg["base_url"] = base_url
    return {"config_list": [cfg]}


def build_agents() -> tuple[AssistantAgent, UserProxyAgent]:
    """Construct the brain + hands. No network call happens here."""
    assistant = AssistantAgent(
        name="assistant",
        llm_config=build_llm_config(),
        system_message=(
            "You are an autonomous problem solver. Solve the task by writing a single "
            "self-contained Python code block; the executor will run it and return the "
            "output to you. Inspect the output, and if the task is complete reply with "
            "the single word TERMINATE. Do not ask the user questions."
        ),
    )
    executor = UserProxyAgent(
        name="executor",
        human_input_mode="NEVER",            # autonomy: no human in the loop
        max_consecutive_auto_reply=10,        # runaway guard: hard cap on turns
        is_termination_msg=lambda m: "TERMINATE" in (m.get("content") or ""),
        code_execution_config={
            # NOTE: use_docker=False runs model-written code directly on this host.
            # Fine in an ephemeral sandbox; use Docker (use_docker=True) for real work.
            "work_dir": "runs",
            "use_docker": False,
        },
    )
    return assistant, executor


def smoke_test() -> int:
    """Construct the agents and confirm wiring without any API call."""
    assistant, executor = build_agents()
    assert assistant.name == "assistant"
    assert executor.name == "executor"
    assert executor.human_input_mode == "NEVER"
    print("[smoke] OK: agents constructed, no network call made.")
    print(f"[smoke] model={MODEL} base_url={os.environ.get('ANTHROPIC_BASE_URL') or '(default)'}")
    return 0


def main() -> int:
    assistant, executor = build_agents()
    # The executor kicks off and drives the loop until TERMINATE or the reply cap.
    executor.initiate_chat(assistant, message=TASK)
    return 0


if __name__ == "__main__":
    if "--smoke" in sys.argv[1:]:
        raise SystemExit(smoke_test())
    raise SystemExit(main())
