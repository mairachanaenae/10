# Minimal autonomous agent loop — `ag2` + Claude

A ~40-line, runnable example of an **autonomous agent**: a loop that picks its own
next action, executes it, sees the result, and stops on a termination condition.

It uses [`ag2`](https://github.com/ag2ai/ag2) (the AutoGen fork) with two agents:

| Agent | Role | In the code |
|-------|------|-------------|
| `assistant` | the **brain** — proposes the next move as a Python code block | `AssistantAgent` + Claude `llm_config` |
| `executor` | the **hands** — runs that code and feeds the result back | `UserProxyAgent` with `code_execution_config` |

### The loop, in four parts

- **Action** → `code_execution_config` lets the executor run Python (its one "hand").
- **Feedback** → the executor returns stdout/stderr to the assistant every turn.
- **Termination** → `is_termination_msg` (the `TERMINATE` signal) **and**
  `max_consecutive_auto_reply=10` (a hard runaway cap). Both matter.
- **Autonomy** → `human_input_mode="NEVER"` — the one line that turns "you drive each
  step" into "it drives itself."

The demo task: *compute the primes below 100, write them to `runs/primes.txt`, print them.*

## Setup

```bash
pip install -r requirements.txt   # installs ag2[anthropic] + the anthropic SDK
```

This example targets **Claude** (`claude-opus-4-8`). Configure auth via environment:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`) | your Claude API key |
| `ANTHROPIC_BASE_URL` | optional — point at a gateway/proxy instead of `api.anthropic.com` |

The script reads these at runtime. `ANTHROPIC_BASE_URL` is passed to the client
explicitly (ag2's Anthropic client does not read it from the env on its own).

## Run

```bash
# Live — runs the autonomous loop end to end
python3 autonomous_agent.py

# Offline — constructs the agents and checks wiring, no network call, no key needed
python3 autonomous_agent.py --smoke
```

A successful live run ends with `runs/primes.txt` containing the 25 primes below 100
(`2,3,5,...,97`) and the conversation terminating on `TERMINATE`.

## Point it elsewhere

Swap the provider by changing `build_llm_config()` in `autonomous_agent.py` — only the
config changes; the loop is identical. For OpenAI, use
`{"model": "gpt-4o", "api_key": os.environ["OPENAI_API_KEY"]}` and `pip install ag2[openai]`.

## Variation: investing mentor panel (`investing_mentors.py`)

A second example that reuses the same Claude config but flips the shape from "two robots
running code" to a **round-table of legendary investors who mentor you**. Each is an
agent with a famous investor's style — Buffett, Munger, Lynch, Graham — plus a **financial
historian** (lessons from past crashes, bubbles, and dividend track records) and an
**analyst** who ties it together into a plain-English takeaway. Focus: long-term + dividends.

```bash
python3 investing_mentors.py          # self-driving panel, seeded with a beginner question
python3 investing_mentors.py --chat   # you type questions and the panel answers
python3 investing_mentors.py --smoke  # check wiring, no API key, no network
```

> **Educational only — not financial advice.** The agents imitate public investing
> philosophies to teach how careful investors *reason*. No one can reliably predict
> markets and nothing here promises returns. Do your own research and consider a licensed
> advisor before investing real money.

## ⚠️ Safety

`code_execution_config` uses `use_docker=False`, which runs **model-written code directly
on the host**. That's acceptable in a throwaway sandbox but not for real use — set
`use_docker=True` (requires Docker) to isolate the agent's "hands," matching the
security-boundary principle: a code/bash tool is maximum leverage *and* maximum blast
radius.
