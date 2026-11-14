"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Entry } from "@/lib/game/entry";
import { FLAG_LABELS, type ExamFlags } from "@/lib/game/exam";
import { findEntry } from "@/lib/game/progress";
import { formatUsd } from "@/lib/game/rules";
import { settlementFor } from "@/lib/game/settle";
import { TestModeBanner } from "@/components/play/TestModeBanner";
import { AppealForm } from "./AppealForm";
import { BeforeAfter } from "./BeforeAfter";
import { CriteriaTable } from "./CriteriaTable";
import { PayoutBreakdown } from "./PayoutBreakdown";
import { PayoutCalculator } from "./PayoutCalculator";

const HEADLINE: Record<Entry["status"], string> = {
  won: "Goal reached",
  lost: "Goal not reached this time",
  appeal_review: "Under review",
  active: "Game in progress",
};

export function ResultView({ id }: { id: string }) {
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  useEffect(() => setEntry(findEntry(id)), [id]);

  if (entry === undefined) return <p className="font-mono text-sm text-muted">loading…</p>;
  if (!entry?.exam) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">No result here yet</h2>
        <p className="text-sm text-muted">Results are saved in the browser that took the exam.</p>
        <Link href="/dashboard" className="w-fit text-sm text-accent hover:underline">
          Open dashboard
        </Link>
      </div>
    );
  }

  const exam = entry.exam;
  const { settlement } = settlementFor(entry.stakeCents, exam.input);
  const flags = (Object.keys(exam.input.flags) as (keyof ExamFlags)[]).filter((k) => exam.input.flags[k]);

  return (
    <div className="flex flex-col gap-5">
      <TestModeBanner />

      <section className={`rounded-lg border bg-surface p-5 ${entry.status === "won" ? "border-accent/50" : "border-line"}`}>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Kickstarter · {formatUsd(entry.stakeCents)} stake</p>
        <h2 className="mt-2 text-3xl font-semibold">{HEADLINE[entry.status]}</h2>
        <p className="mt-2 text-muted">
          {entry.status === "won" && `You get ${formatUsd(entry.payoutCents ?? 0)} back: your stake plus your share of the pool.`}
          {entry.status === "lost" &&
            (exam.outcome.examPassed
              ? "You passed the exam, but the game also needs enough practice days. Your stake goes to the players who finished."
              : "Your stake goes to the players who finished. Your progress and rating stay with you.")}
          {entry.status === "appeal_review" &&
            (entry.appeal
              ? `Appeal filed: ${entry.appeal.reason}. Nothing is paid out until the review is done.`
              : "Your exam was flagged, so it goes to a review before any payout.")}
        </p>
      </section>

      <CriteriaTable
        criteria={exam.outcome.criteria}
        footer={
          flags.length > 0 && (
            <p className="border-t border-line px-4 py-2.5 text-sm text-warn">
              Flags: {flags.map((f) => FLAG_LABELS[f]).join(" · ")}
            </p>
          )
        }
      />

      <BeforeAfter entry={entry} exam={exam} />
      <PayoutBreakdown s={settlement} stakeCents={entry.stakeCents} status={entry.status} />

      {entry.status === "lost" && !entry.appeal && <AppealForm entry={entry} onChange={setEntry} />}

      <PayoutCalculator />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/play" className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink hover:opacity-90">
          Start your next game
        </Link>
        <Link href="/" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
          Back to home
        </Link>
      </div>
    </div>
  );
}
