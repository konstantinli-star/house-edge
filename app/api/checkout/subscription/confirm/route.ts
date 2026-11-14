// Confirms a finished test-mode subscription checkout.

import { getTestStripe } from "@/lib/server/stripe";
import { isSubscriptionSession } from "@/lib/server/subscription";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const stripe = getTestStripe();
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!stripe || !sessionId) return Response.json({ error: "Missing checkout session." }, { status: 400 });
  if (!(await isSubscriptionSession(stripe, sessionId))) {
    return Response.json({ error: "Subscription was not completed." }, { status: 402 });
  }
  return Response.json({ active: true });
}
