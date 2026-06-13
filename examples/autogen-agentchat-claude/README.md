# Microsoft AutoGen (`autogen-agentchat`) — Claude version

The command you had installs Microsoft's AutoGen with the **OpenAI** client:

```bash
pip install -U "autogen-agentchat" "autogen-ext[openai]"
```

The **Claude** version just swaps the extension to Anthropic:

```bash
pip install -U "autogen-agentchat" "autogen-ext[anthropic]"
```

Then use the Anthropic model client instead of the OpenAI one:

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.anthropic import AnthropicChatCompletionClient

model_client = AnthropicChatCompletionClient(model="claude-opus-4-8")  # reads ANTHROPIC_API_KEY
agent = AssistantAgent("assistant", model_client=model_client)
```

See `hello_claude.py` for a runnable example.

## Heads-up: two different "AutoGen" libraries

| | Install | Import namespace | Used in |
|--|--|--|--|
| **ag2** (the fork) | `pip install "ag2[anthropic]"` | `autogen` | `../ag2-autonomous-claude` (the mentor panel) |
| **Microsoft AutoGen** v0.4+ | `pip install "autogen-agentchat" "autogen-ext[anthropic]"` | `autogen_agentchat`, `autogen_ext` | this folder |

They share the AutoGen lineage but have different APIs. Pick one per project — don't mix
them in the same script.

> Verified against `autogen-agentchat 0.7.5` / `autogen-ext 0.7.5` and `anthropic 0.109.1`.
> Model id `claude-opus-4-8` is the current Opus per the Claude API reference.
