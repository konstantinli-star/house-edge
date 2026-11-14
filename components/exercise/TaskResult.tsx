import Link from "next/link";
import type { RatingChange } from "@/lib/game/rating";
import type { Task } from "@/lib/game/tasks";
import { TARGETS } from "@/lib/proof/score";
import type { SpeechMetrics } from "@/lib/proof/metrics";

type Props = {
  task: Task;
  metrics: SpeechMetrics;
  change: RatingChange | null; // null when the take was not rated
  note?: string;
  onNext?: () => void;
};

// Result card after each attempt: limits met or not, and the rating change.
export function TaskResult({ task, metrics: m, change, note, onNext }: Props) {
  const checks = [
    { label: "fillers/min", value: m.fillersPerMin.toFixed(1), ok: m.fillersPerMin <= task.fillerLimitPerMin, limit: `≤ ${task.fillerLimitPerMin}` },
    { label: "pace", value: `${m.wpm} wpm`, ok: m.wpm >= TARGETS.paceMin && m.wpm <= TARGETS.paceMax, limit: `${TARGETS.paceMin}–${TARGETS.paceMax}` },
    { label: "time used", value: `${m.speakingSec} s`, ok: m.speakingSec >= 0.8 * task.timeLimitSec, limit: `≥ ${Math.round(0.8 * task.timeLimitSec)} s` },
  ];

  return (
    <div className="flex flex-col gap-4">
      {change ? (
        <div className="flex items-end justify-between gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">Speaker Rating</p>
            <p className="font-mono text-5xl font-semibold tabular-nums text-accent">{change.after}</p>
          </div>
          <div className="text-right font-mono text-sm">
            <p className={change.delta >= 0 ? "text-accent" : "text-warn"}>
              {change.delta >= 0 ? "+" : ""}
              {change.delta}
            </p>
            <p className="text-xs text-muted">
              performance {change.performance.toFixed(2)} vs expected {change.expected.toFixed(2)}
            </p>
          </div>
        </div>
      ) : null}

      {note && (
        <p role="status" className="rounded-md border border-warn/40 bg-surface px-4 py-2 text-sm text-warn">
          {note}
        </p>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface font-mono text-sm">
        {checks.map((c) => (
          <li key={c.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5">
            <span className="text-muted">{c.label}</span>
            <span className="tabular-nums">{c.value}</span>
            <span className={c.ok ? "text-accent" : "text-warn"}>
              {c.ok ? "✓" : "✗"} {c.limit}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
          >
            Next task
          </button>
        )}
        <Link href="/dashboard" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
