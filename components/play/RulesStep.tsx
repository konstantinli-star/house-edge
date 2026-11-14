import { formatUsd, KICKSTARTER } from "@/lib/game/rules";

// Kickstarter rules. Every number comes from the same constants the code checks.
export function RulesStep({ onNext }: { onNext: () => void }) {
  const k = KICKSTARTER;
  const rules = [
    `${k.days} days. 10–15 minutes of timed exercises a day.`,
    `Win = pass the live final exam AND practise on at least ${k.minPracticeDays} of ${k.days} days.`,
    `Exam: fillers ≤ ${k.exam.maxFillersPerMin}/min, eye contact ≥ ${k.exam.minEyeContactPct}%, pace ${k.exam.paceMin}–${k.exam.paceMax} wpm.`,
    `Stakes: ${k.tiersCents.map(formatUsd).join(" / ")}. Your first game is capped at ${formatUsd(k.firstStakeMaxCents)}.`,
    `Winners get their full stake back plus a share of what others left. Our ${k.commissionRate * 100}% fee comes only out of that money, never out of a winner's stake.`,
    `One appeal per game (illness, force majeure). An approved appeal counts as a win.`,
    `No doubling, no raising your stake mid-game, no credit.`,
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">rules</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {rules.map((r) => (
            <li key={r} className="flex gap-3">
              <span className="text-muted" aria-hidden>
                ›
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">weekly themes</h2>
        <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {k.weeks.map((w) => (
            <li key={w.week} className="flex gap-3">
              <span className="font-mono text-muted">W{w.week}</span>
              <span>{w.theme}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
        >
          Start my 3-speech baseline
        </button>
        <p className="text-xs text-muted">
          Your goal is set from the average of 3 one-minute speeches on random topics, so one bad take can’t skew it.
        </p>
      </div>
    </div>
  );
}
