import { SAMPLE_GOALS, SAMPLE_HOLDINGS } from "./sample-data";
import type { Goal, Holding } from "./types";

/**
 * Data access. M2 wires these to Supabase (per Clerk user) with the sample data as the
 * signed-out / unconfigured fallback. For now everything reads the sample portfolio.
 */
export async function getHoldings(): Promise<Holding[]> {
  return SAMPLE_HOLDINGS;
}

export async function getGoals(): Promise<Goal[]> {
  return SAMPLE_GOALS;
}
