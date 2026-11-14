// Records self-exclusion on the player's account, so the checkout route
// refuses stakes even from another browser. Free games stay available.

import { getSupabaseAdmin, playerFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ stored: "browser-only" });
  const playerId = await playerFromRequest(req, admin);
  if (!playerId) return Response.json({ error: "Start a guest session first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { excluded?: boolean } | null;
  if (typeof body?.excluded !== "boolean") return Response.json({ error: "Invalid request." }, { status: 400 });

  const { error } = await admin
    .from("players")
    .upsert({ id: playerId, self_excluded: body.excluded }, { onConflict: "id" });
  if (error) return Response.json({ error: "Could not save the setting." }, { status: 500 });
  return Response.json({ stored: "account", excluded: body.excluded });
}
