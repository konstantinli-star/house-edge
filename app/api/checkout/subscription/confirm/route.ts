// Confirms a finished test-mode subscription checkout.

import { getTestStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const stripe = getTestStripe();
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!stripe || !sessionId) return Response.json({ error: "Missing checkout session." }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  const active = Boolean(session && !session.livemode && session.mode === "subscription" && session.status === "complete" && session.subscription);
  if (!active) return Response.json({ error: "Subscription was not completed." }, { status: 402 });
  return Response.json({ active: true });
}
