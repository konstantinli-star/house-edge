import "server-only";
import Stripe from "stripe";

// Stripe client that refuses to run with anything but a TEST-MODE key.
// This product must never move real money.
export function getTestStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_test_/.test(key)) return null;
  return new Stripe(key);
}
