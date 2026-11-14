// Verifies a finished test-mode Checkout session and records the entry.
// Safe to call twice: the Stripe session id is unique on entries.

import { buildEntry, type Entry } from "@/lib/game/entry";
import type { Baseline } from "@/lib/game/baseline";
import { getTestStripe } from "@/lib/server/stripe";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const GAME_SLUG = "kickstarter-2026-11";

export async function GET(req: Request) {
  const stripe = getTestStripe();
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!stripe || !sessionId) return Response.json({ error: "Missing checkout session." }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  if (!session || session.livemode) return Response.json({ error: "Checkout session not found." }, { status: 404 });
  if (session.payment_status !== "paid") {
    return Response.json({ error: "Payment was not completed." }, { status: 402 });
  }

  const meta = session.metadata ?? {};
  const baseline = JSON.parse(meta.baseline ?? "null") as Baseline;
  const stakeCents = Number(meta.stake_cents);
  const admin = getSupabaseAdmin();

  if (!admin || !meta.player_id) {
    return Response.json({ entry: buildEntry(session.id, stakeCents, baseline, "local") });
  }

  const draft = buildEntry(session.id, stakeCents, baseline, "supabase");
  const { data: game, error: gameError } = await admin.from("games").select("id").eq("slug", GAME_SLUG).single();
  if (gameError) return Response.json({ error: "Game not found. Run the database migration." }, { status: 500 });

  const { data: row, error } = await admin
    .from("entries")
    .upsert(
      {
        game_id: game.id,
        player_id: meta.player_id,
        stake_cents: stakeCents,
        goal: draft.goal,
        baseline,
        stripe_session_id: session.id,
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: false },
    )
    .select("id, created_at")
    .single();
  if (error) return Response.json({ error: "Could not save your entry." }, { status: 500 });

  // Ledger lines are written once per entry.
  const { count } = await admin.from("ledger").select("id", { count: "exact", head: true }).eq("entry_id", row.id);
  if (!count) {
    await admin.from("ledger").insert(
      draft.ledger.map((l) => ({ entry_id: row.id, kind: l.kind, amount_cents: l.amountCents, test_mode: true })),
    );
  }

  const entry: Entry = { ...draft, id: row.id, createdAt: row.created_at };
  return Response.json({ entry });
}
