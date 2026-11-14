// Settling an entry after the final exam, and filing the one appeal.
// Pure part (settlementFor) is shared by the browser and the server route.

import type { Entry, ExamRecord } from "./entry";
import { evaluateExam, type ExamInput } from "./exam";
import { finalSettlement, simulatedPool } from "./pool";
import { KICKSTARTER } from "./rules";

export const GAME_SLUG = "kickstarter-2026-11";

export const APPEAL_REASONS = [
  "Illness or medical emergency",
  "Family emergency or force majeure",
  "Technical problem during the exam",
] as const;

export function settlementFor(stakeCents: number, exam: ExamInput) {
  const outcome = evaluateExam(exam);
  const won = outcome.status === "won";
  const settlement = finalSettlement(simulatedPool(GAME_SLUG), KICKSTARTER.days, { stakeCents, won });
  // Under review: nothing is paid until the review is done.
  const payoutCents = outcome.status === "appeal_review" ? null : settlement.yourPayoutCents;
  return { outcome, settlement, payoutCents };
}

type Auth = () => Promise<Record<string, string>>;

export async function settleEntry(entry: Entry, exam: Omit<ExamRecord, "outcome">, authHeader: Auth): Promise<Entry> {
  const { outcome, payoutCents } = settlementFor(entry.stakeCents, exam.input);
  let status: Entry["status"] = outcome.status;
  let payout = payoutCents;

  // With Supabase, the server re-runs the same rules and records the result.
  if (entry.storage === "supabase") {
    const res = await fetch("/api/entry/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ entryId: entry.id, exam: exam.input }),
    });
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not save the result.");
    ({ status, payoutCents: payout } = (await res.json()) as { status: Entry["status"]; payoutCents: number | null });
  }

  return {
    ...entry,
    status,
    payoutCents: payout,
    exam: { ...exam, outcome },
    ledger: payout ? [...entry.ledger, { kind: "payout", amountCents: payout, testMode: true }] : entry.ledger,
  };
}

export async function appealEntry(entry: Entry, reason: string, authHeader: Auth): Promise<Entry> {
  if (entry.storage === "supabase") {
    const res = await fetch("/api/entry/appeal", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ entryId: entry.id, reason }),
    });
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not file the appeal.");
  }
  return { ...entry, status: "appeal_review", appeal: { reason, at: new Date().toISOString() } };
}
