// A player's entry in a game, plus its test-mode ledger lines.
// Built the same way whether it is stored in Supabase or only in the browser.

import { deriveGoal, type Baseline, type Goal } from "./baseline";
import type { ExamInput, ExamOutcome } from "./exam";
import type { RatingChange } from "./rating";
import { KICKSTARTER, tierAvailable } from "./rules";

export type LedgerLine = { kind: "stake_in" | "card_fee" | "payout"; amountCents: number; testMode: true };

export type ExamRecord = {
  input: ExamInput;
  outcome: ExamOutcome;
  rating: RatingChange;
  topic: string;
  takenAt: string;
};

export type Entry = {
  id: string;
  game: typeof KICKSTARTER.slug;
  stakeCents: number;
  goal: Goal;
  baseline: Baseline;
  status: "active" | "won" | "lost" | "appeal_review";
  ledger: LedgerLine[];
  storage: "supabase" | "local";
  createdAt: string;
  exam?: ExamRecord;
  payoutCents?: number | null; // null while under review
  appeal?: { reason: string; at: string };
};

export type StakeRequest = {
  stakeCents: number;
  baseline: Baseline;
  adultConfirmed: boolean;
  gamesPlayed: number;
};

// Server-side validation of what the browser asks to stake.
export function validateStake(req: StakeRequest): string | null {
  if (!req.adultConfirmed) return "Please confirm you are 18 or older.";
  if (!tierAvailable(req.stakeCents, req.gamesPlayed)) {
    return "Choose $50 or $100 for your first game. $250 unlocks after your first game.";
  }
  const b = req.baseline;
  const ratingOk = Number.isInteger(b?.rating) && b.rating >= 400 && b.rating <= 1600;
  if (!ratingOk || b.takes !== KICKSTARTER.baselineTakes) {
    return "Complete the 3-speech baseline before placing a stake.";
  }
  return null;
}

export function buildEntry(id: string, stakeCents: number, baseline: Baseline, storage: Entry["storage"]): Entry {
  return {
    id,
    game: KICKSTARTER.slug,
    stakeCents,
    goal: deriveGoal(baseline.rating),
    baseline,
    status: "active",
    ledger: [
      { kind: "stake_in", amountCents: stakeCents, testMode: true },
      { kind: "card_fee", amountCents: KICKSTARTER.cardFeeCents, testMode: true },
    ],
    storage,
    createdAt: new Date().toISOString(),
  };
}
