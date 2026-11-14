// Prices shown on /pricing. Money flows only in Stripe test mode.

export const SUBSCRIPTION = {
  name: "Upscale subscription",
  priceCents: 999,
  commissionRate: 0,
  maxGames: 3,
} as const;

export const EXTRAS = [
  { name: "Verified Speaker Rating", price: "$19–49", detail: "A shareable certificate after a proctored exam" },
  { name: "1:1 coaching", price: "$49–99", detail: "A coach reviews your recordings with you" },
] as const;

const KEY = "upscale:subscription";

export type StoredSubscription = { since: string; sessionId: string };

export function loadSubscription(): StoredSubscription | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as StoredSubscription | null;
  } catch {
    return null;
  }
}

// The Stripe session id lets the server re-verify the subscription at checkout.
export function saveSubscription(sessionId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ since: new Date().toISOString(), sessionId }));
  } catch {
    // Not persisted; the checkout still happened in Stripe test mode.
  }
}
