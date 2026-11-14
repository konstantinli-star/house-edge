// Creates a Stripe Checkout session in TEST MODE for a Kickstarter stake.

import { validateStake, type StakeRequest } from "@/lib/game/entry";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { getTestStripe } from "@/lib/server/stripe";
import { getSupabaseAdmin, playerFromRequest } from "@/lib/server/supabase-admin";
import { commissionRateFor } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getTestStripe();
  if (!stripe) return Response.json({ error: "Test checkout is not configured yet." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as StakeRequest | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  // With Supabase, trust the server's own records over the browser.
  const admin = getSupabaseAdmin();
  let playerId: string | null = null;
  if (admin) {
    playerId = await playerFromRequest(req, admin);
    if (!playerId) return Response.json({ error: "Start a guest session first." }, { status: 401 });

    const { data: player } = await admin.from("players").select("self_excluded").eq("id", playerId).maybeSingle();
    if (player?.self_excluded) {
      return Response.json({ error: "Stakes are turned off for your account (self-exclusion)." }, { status: 403 });
    }
    const { count } = await admin.from("entries").select("id", { count: "exact", head: true }).eq("player_id", playerId);
    body.gamesPlayed = Math.max(body.gamesPlayed ?? 0, count ?? 0);
    await admin
      .from("players")
      .upsert({ id: playerId, adult_confirmed_at: new Date().toISOString() }, { onConflict: "id" });
  }

  const problem = validateStake(body);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const commissionRate = await commissionRateFor(stripe, body.subscriptionSessionId, admin, playerId);
  const origin = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Same page for every visitor: English, USD, card only (the test card is shown on our page).
    locale: "en",
    payment_method_types: ["card"],
    adaptive_pricing: { enabled: false },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: body.stakeCents,
          product_data: {
            name: `${KICKSTARTER.name} stake: ${formatUsd(body.stakeCents)}`,
            description: "Test mode. No real money moves. Reach your goal to get your stake back plus a share of the pool.",
          },
        },
      },
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: KICKSTARTER.cardFeeCents, product_data: { name: "Card service fee" } },
      },
    ],
    success_url: `${origin}/play/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/play?canceled=1`,
    client_reference_id: playerId ?? undefined,
    metadata: {
      game: KICKSTARTER.slug,
      stake_cents: String(body.stakeCents),
      baseline: JSON.stringify(body.baseline),
      player_id: playerId ?? "",
      commission_rate: String(commissionRate),
    },
  });

  return Response.json({ url: session.url });
}
