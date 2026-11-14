// Prices shown on /pricing. Money flows only in Stripe test mode.

export const SUBSCRIPTION = {
  name: "House Edge subscription",
  priceCents: 999,
  commissionRate: 0,
  maxGames: 3,
} as const;

export const EXTRAS = [
  { name: "Verified Speaker Rating", price: "$19–49", detail: "A shareable certificate after a proctored exam" },
  { name: "1:1 coaching", price: "$49–99", detail: "A coach reviews your recordings with you" },
] as const;

const KEY = "house-edge:subscription";

export function loadSubscription(): { since: string } | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as { since: string } | null;
  } catch {
    return null;
  }
}

export function saveSubscription() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ since: new Date().toISOString() }));
  } catch {
    // Not persisted; the checkout still happened in Stripe test mode.
  }
}
