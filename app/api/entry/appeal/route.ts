// One appeal per game: a lost entry moves to review. Approved appeals count
// as a win; review itself is manual (no admin panel in this build).

import { APPEAL_REASONS } from "@/lib/game/settle";
import { getSupabaseAdmin, playerFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Storage is not configured." }, { status: 503 });
  const playerId = await playerFromRequest(req, admin);
  if (!playerId) return Response.json({ error: "Start a guest session first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { entryId?: string; reason?: string } | null;
  if (!body?.entryId || !APPEAL_REASONS.includes(body.reason as (typeof APPEAL_REASONS)[number])) {
    return Response.json({ error: "Choose a reason for the appeal." }, { status: 400 });
  }

  // Only a lost entry can be appealed, and only once (review is a one-way state).
  const { data, error } = await admin
    .from("entries")
    .update({ status: "appeal_review" })
    .eq("id", body.entryId)
    .eq("player_id", playerId)
    .eq("status", "lost")
    .select("id");
  if (error) return Response.json({ error: "Could not file the appeal." }, { status: 500 });
  if (!data?.length) return Response.json({ error: "This game can’t be appealed." }, { status: 409 });
  return Response.json({ status: "appeal_review" });
}
