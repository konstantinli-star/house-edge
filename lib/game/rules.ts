// Kickstarter: the only fully implemented game. All rule numbers live here
// and are shown on the rules screen, so what the user reads is what the code checks.

import { TARGETS } from "@/lib/proof/score";

export const KICKSTARTER = {
  slug: "kickstarter",
  name: "Kickstarter",
  days: 30,
  minPracticeDays: 24,
  tiersCents: [5000, 10000, 25000],
  firstStakeMaxCents: 10000,
  cardFeeCents: 350,
  commissionRate: 0.15, // taken only from the money of players who missed the goal
  ratingGainTarget: 150,
  appealsPerGame: 1,
  baselineTakes: 3,
  exam: TARGETS,
  weeks: [
    { week: 1, theme: "Filler words and pace" },
    { week: 2, theme: "Structure: thesis → argument → conclusion" },
    { week: 3, theme: "Voice and body: monotony, eye contact" },
    { week: 4, theme: "Q&A and demo rehearsal" },
  ],
} as const;

export const formatUsd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

// First game is capped at $100 so nobody starts with the highest tier.
export function tierAvailable(stakeCents: number, gamesPlayed: number): boolean {
  if (!(KICKSTARTER.tiersCents as readonly number[]).includes(stakeCents)) return false;
  return gamesPlayed > 0 || stakeCents <= KICKSTARTER.firstStakeMaxCents;
}
