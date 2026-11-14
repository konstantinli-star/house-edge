"use client";

import { useState } from "react";
import type { Baseline, Goal } from "@/lib/game/baseline";
import { loadEntries } from "@/lib/game/progress";
import { formatUsd, KICKSTARTER, tierAvailable } from "@/lib/game/rules";
import { guestAuthHeader, startGuest } from "@/lib/guest";
import { TestCard } from "./TestCard";

// Goal from the baseline, tier picker, price breakdown, then Stripe test checkout.
export function StakeStep({ baseline, goal }: { baseline: Baseline; goal: Goal }) {
  const gamesPlayed = loadEntries().length;
  const [stake, setStake] = useState<number>(KICKSTARTER.firstStakeMaxCents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      await startGuest();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await guestAuthHeader()) },
        body: JSON.stringify({ stakeCents: stake, baseline, adultConfirmed: true, gamesPlayed }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout is unavailable right now.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <GoalCard baseline={baseline} goal={goal} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-mono text-sm text-accent">choose your stake</legend>
        <div className="grid grid-cols-3 gap-3">
          {KICKSTARTER.tiersCents.map((cents) => {
            const available = tierAvailable(cents, gamesPlayed);
            return (
              <label
                key={cents}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-4 has-[:checked]:border-accent has-[:checked]:bg-raised ${available ? "border-line" : "cursor-not-allowed border-line opacity-50"}`}
              >
                <input
                  type="radio"
                  name="stake"
                  value={cents}
                  checked={stake === cents}
                  disabled={!available}
                  onChange={() => setStake(cents)}
                  className="sr-only"
                />
                <span className="font-mono text-2xl">{formatUsd(cents)}</span>
                {!available && <span className="text-center text-xs text-muted">after your first game</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <dl className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 font-mono text-sm">
        <Line label="stake (back to you if you reach the goal)" value={formatUsd(stake)} />
        <Line label="card service fee" value={formatUsd(KICKSTARTER.cardFeeCents)} />
        <div className="my-1 border-t border-line" />
        <Line label="total today" value={formatUsd(stake + KICKSTARTER.cardFeeCents)} strong />
        <p className="mt-2 font-sans text-xs text-muted">
          Players who reach the goal split the stakes of those who don’t, in proportion to their stakes. Our{" "}
          {KICKSTARTER.commissionRate * 100}% fee comes only out of that money; we never take from a winner’s own stake.
        </p>
      </dl>

      <TestCard />

      {error && (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={checkout}
        disabled={busy}
        className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Opening test checkout…" : `Commit ${formatUsd(stake)} in test mode`}
      </button>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function GoalCard({ baseline, goal }: { baseline: Baseline; goal: Goal }) {
  const rows = [
    { label: "fillers/min", from: baseline.fillersPerMin.toFixed(1), to: `≤ ${goal.exam.maxFillersPerMin}` },
    { label: "pace", from: `${baseline.wpm} wpm`, to: `${goal.exam.paceMin}–${goal.exam.paceMax}` },
    { label: "eye contact", from: "exam", to: `≥ ${goal.exam.minEyeContactPct}%` },
    { label: "practice days", from: "0", to: `≥ ${goal.minPracticeDays} of ${goal.days}` },
    { label: "speaker rating", from: String(goal.ratingFrom), to: `${goal.ratingTarget} target` },
  ];
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-2 font-mono text-xs text-muted">
        your goal · from a {baseline.takes}-speech baseline
      </h2>
      <table className="w-full font-mono text-sm">
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-4 py-2 text-left font-normal text-muted">
                {r.label}
              </th>
              <td className="px-2 py-2 text-right tabular-nums">{r.from}</td>
              <td className="px-2 py-2 text-muted" aria-hidden>
                →
              </td>
              <td className="px-4 py-2 text-accent">{r.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
