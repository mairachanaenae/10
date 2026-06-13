/** Clerk is optional: the app runs in a demo mode when no Clerk key is present. */
export function authConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Server-side display name. Uses Clerk when configured, otherwise the demo user.
 * Kept dynamic-import so the app builds/runs without Clerk env vars.
 */
export async function getDisplayName(): Promise<string> {
  if (!authConfigured()) return "Maira";
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    return u?.firstName || u?.username || "Investor";
  } catch {
    return "Investor";
  }
}
