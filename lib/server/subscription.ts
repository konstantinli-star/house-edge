import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIPTION } from "@/lib/pricing";
import { KICKSTARTER } from "@/lib/game/rules";

// True if this is a completed TEST-MODE subscription checkout.
export async function isSubscriptionSession(stripe: Stripe, sessionId: string): Promise<boolean> {
  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  return Boolean(
    session && !session.livemode && session.mode === "subscription" && session.status === "complete" && session.subscription,
  );
}

// Subscribers pay 0% on up to SUBSCRIPTION.maxGames games per 30 days; after that, the open-game rate.
export async function commissionRateFor(
  stripe: Stripe,
  subscriptionSessionId: string | undefined,
  admin: SupabaseClient | null,
  playerId: string | null,
): Promise<number> {
  if (!subscriptionSessionId || !(await isSubscriptionSession(stripe, subscriptionSessionId))) {
    return KICKSTARTER.commissionRate;
  }
  if (admin && playerId) {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { count } = await admin
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("player_id", playerId)
      .gte("created_at", since)
      .eq("goal->>commissionRate", "0");
    if ((count ?? 0) >= SUBSCRIPTION.maxGames) return KICKSTARTER.commissionRate;
  }
  return SUBSCRIPTION.commissionRate;
}
