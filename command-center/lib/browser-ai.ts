// Browser-direct Claude calls using the user's own API key (stored only in their
// browser's localStorage — never committed, never sent to any server but Anthropic).
// This is what makes the agents genuinely autonomous on the static site.
//
// Uses Anthropic's "dangerous-direct-browser-access" mode. The key lives in YOUR
// browser; treat the link as personal. For multi-user/secure use, deploy to Vercel
// with a server route instead.
import { MODEL } from "./ai/provider";

const KEY = "cc_anthropic_key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
export function setApiKey(k: string) {
  localStorage.setItem(KEY, k.trim());
}
export function clearApiKey() {
  localStorage.removeItem(KEY);
}
export function hasKey(): boolean {
  return Boolean(getApiKey());
}

export interface Msg {
  role: "user" | "assistant";
  content: string;
}

async function call(system: string, messages: Msg[], maxTokens: number): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("No API key set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${t.slice(0, 160)}`);
  }
  const data = await res.json();
  const block = Array.isArray(data.content)
    ? data.content.find((b: { type: string }) => b.type === "text")
    : null;
  return block?.text ?? "";
}

export function ask(system: string, user: string, maxTokens = 400): Promise<string> {
  return call(system, [{ role: "user", content: user }], maxTokens);
}

export function chat(system: string, messages: Msg[], maxTokens = 600): Promise<string> {
  return call(system, messages, maxTokens);
}

/** Verify a key works (cheap call). Returns null on success, else an error string. */
export async function verifyKey(): Promise<string | null> {
  try {
    await ask("You are a connectivity probe. Reply with the single word OK.", "ping", 8);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "failed";
  }
}
