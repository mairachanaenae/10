#!/usr/bin/env python3
"""Minimal Microsoft AutoGen (autogen-agentchat) example, pointed at Claude.

NOTE: this is a DIFFERENT library from `ag2` used in ../ag2-autonomous-claude.
  - ag2:                pip install "ag2[anthropic]"           (namespace: autogen)
  - Microsoft AutoGen:  pip install "autogen-agentchat" "autogen-ext[anthropic]"
                        (namespaces: autogen_agentchat / autogen_ext / autogen_core)

The user's command installs the OpenAI client:
    pip install -U "autogen-agentchat" "autogen-ext[openai]"
The Claude version just swaps the extension to anthropic:
    pip install -U "autogen-agentchat" "autogen-ext[anthropic]"

Run:
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 hello_claude.py
"""

import asyncio

from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.anthropic import AnthropicChatCompletionClient


async def main() -> None:
    # Reads ANTHROPIC_API_KEY from the environment (or pass api_key="...").
    model_client = AnthropicChatCompletionClient(model="claude-opus-4-8")

    agent = AssistantAgent(
        name="assistant",
        model_client=model_client,
        system_message="You are a concise, helpful assistant.",
    )

    result = await agent.run(task="In one sentence, what is an autonomous agent?")
    print(result.messages[-1].content)

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
