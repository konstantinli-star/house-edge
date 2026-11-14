// Stripe Checkout in TEST MODE for the $9.99/month subscription.

import { SUBSCRIPTION } from "@/lib/pricing";
import { getTestStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getTestStripe();
  if (!stripe) return Response.json({ error: "Test checkout is not configured yet." }, { status: 503 });

  const origin = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    // Same page for every visitor: English, USD, card only.
    locale: "en",
    payment_method_types: ["card"],
    adaptive_pricing: { enabled: false },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: SUBSCRIPTION.priceCents,
          recurring: { interval: "month" },
          product_data: {
            name: SUBSCRIPTION.name,
            description: "Test mode. No real money moves. 0% commission, up to 3 games at a time.",
          },
        },
      },
    ],
    success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });
  return Response.json({ url: session.url });
}
