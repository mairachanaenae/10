import Anthropic from "@anthropic-ai/sdk";

/** Current Opus model. Swap the provider here to change AI backends app-wide. */
export const MODEL = "claude-opus-4-8";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Anthropic client. Auth + base-url handling ported from the prototype
 * (examples/ag2-autonomous-claude/autonomous_agent.py:42-64).
 */
export function getClient(): Anthropic {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || "missing-key";
  const baseURL = process.env.ANTHROPIC_BASE_URL || undefined;
  return new Anthropic({ apiKey, baseURL });
}
