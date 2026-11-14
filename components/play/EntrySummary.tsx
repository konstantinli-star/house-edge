import Link from "next/link";
import type { Entry } from "@/lib/game/entry";
import { formatUsd } from "@/lib/game/rules";
import { GoalCard } from "./StakeStep";

const LEDGER_LABELS: Record<string, string> = { stake_in: "stake in", card_fee: "card service fee" };

// The player's active game: goal plus the test-mode ledger.
export function EntrySummary({ entry }: { entry: Entry }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-accent/40 bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">You’re in · day 1 of {entry.goal.days}</p>
        <p className="mt-2 text-2xl font-semibold">{formatUsd(entry.stakeCents)} committed to your goal</p>
        <p className="mt-1 text-sm text-muted">Started {new Date(entry.createdAt).toLocaleDateString("en-US")}.</p>
      </div>

      <GoalCard baseline={entry.baseline} goal={entry.goal} />

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line px-4 py-2 font-mono text-xs text-muted">
          ledger · test mode · {entry.storage === "supabase" ? "saved to your account" : "saved in this browser"}
        </h2>
        <ul className="divide-y divide-line font-mono text-sm">
          {entry.ledger.map((l) => (
            <li key={l.kind} className="flex justify-between px-4 py-2">
              <span className="text-muted">{LEDGER_LABELS[l.kind] ?? l.kind}</span>
              <span className="tabular-nums">{formatUsd(l.amountCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/dashboard"
        className="w-fit rounded-md bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90"
      >
        Open my dashboard
      </Link>
    </div>
  );
}
