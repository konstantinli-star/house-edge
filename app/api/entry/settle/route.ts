// Records the final-exam result for an entry. The server re-runs the same
// exam rules and payout function; the browser only sends the measurements.

import type { ExamInput } from "@/lib/game/exam";
import { settlementFor } from "@/lib/game/settle";
import { getSupabaseAdmin, playerFromRequest } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

const isNum = (n: unknown) => typeof n === "number" && Number.isFinite(n);

function validExam(x: ExamInput | undefined): x is ExamInput {
  return Boolean(
    x && isNum(x.fillersPerMin) && isNum(x.wpm) && isNum(x.speakingSec) && isNum(x.practiceDays) &&
      (x.eyeContactPct === null || isNum(x.eyeContactPct)) && typeof x.flags === "object",
  );
}

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Storage is not configured." }, { status: 503 });
  const playerId = await playerFromRequest(req, admin);
  if (!playerId) return Response.json({ error: "Start a guest session first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { entryId?: string; exam?: ExamInput } | null;
  if (!body?.entryId || !validExam(body.exam)) return Response.json({ error: "Invalid exam result." }, { status: 400 });

  const { data: entry } = await admin
    .from("entries")
    .select("id, stake_cents, status")
    .eq("id", body.entryId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (!entry) return Response.json({ error: "Entry not found." }, { status: 404 });
  if (entry.status !== "active") return Response.json({ error: "This game is already settled." }, { status: 409 });

  const { outcome, payoutCents } = settlementFor(entry.stake_cents, body.exam);
  const { error } = await admin
    .from("entries")
    .update({ status: outcome.status, payout_cents: payoutCents })
    .eq("id", entry.id)
    .eq("status", "active"); // guards against a double submit
  if (error) return Response.json({ error: "Could not save the result." }, { status: 500 });

  if (payoutCents) {
    await admin.from("ledger").insert({ entry_id: entry.id, kind: "payout", amount_cents: payoutCents, test_mode: true });
  }
  return Response.json({ status: outcome.status, payoutCents });
}
