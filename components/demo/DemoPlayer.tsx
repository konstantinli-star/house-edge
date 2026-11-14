"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { JAKE, runJakeDemo } from "@/lib/demo/jake";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { useVirtualClock } from "@/hooks/useVirtualClock";
import { CommunityFeed } from "@/components/dashboard/CommunityFeed";
import { PayoutForecast } from "@/components/dashboard/PayoutForecast";
import { RatingChart } from "@/components/dashboard/RatingChart";
import { WeekProgress } from "@/components/dashboard/WeekProgress";
import { TestModeBanner } from "@/components/play/TestModeBanner";
import { CriteriaTable } from "@/components/result/CriteriaTable";
import { PayoutBreakdown } from "@/components/result/PayoutBreakdown";
import { DemoDayCard } from "./DemoDayCard";

// Frames: 0 = baseline, 1–30 = days, 31 = final exam, 32 = payout.
const EXAM_FRAME = KICKSTARTER.days + 1;
const PAYOUT_FRAME = KICKSTARTER.days + 2;
const FRAME_MS = (f: number) => (f === 0 ? 3000 : f === EXAM_FRAME ? 4500 : 1700);

export function DemoPlayer() {
  // The whole run is computed here, in the browser, by the real game code.
  const run = useMemo(() => runJakeDemo(), []);
  const durationMs = useCallback(FRAME_MS, []);
  const clock = useVirtualClock(PAYOUT_FRAME + 1, durationMs);
  const f = clock.frame;

  const dayIndex = Math.min(Math.max(f, 1), KICKSTARTER.days) - 1;
  const day = run.days[dayIndex];
  const history = run.history.filter((p) => {
    if (p.label === "start") return true;
    if (p.label === "exam") return f >= EXAM_FRAME;
    return f >= 1 && Number(p.label.slice(1)) <= f;
  });
  const rating = history.at(-1)!.rating;
  const won = run.exam.outcome.status === "won";

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-lg border border-warn/40 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-warn">Demo data · replayed through the real code</p>
          <p className="mt-1 text-sm">
            <strong>
              {JAKE.name}, {JAKE.age}
            </strong>
            , {JAKE.role.toLowerCase()}. {JAKE.story}
          </p>
        </div>
        <span className="shrink-0 font-mono text-sm text-muted">{formatUsd(JAKE.stakeCents)} stake</span>
      </section>

      <Controls clock={clock} label={frameLabel(f)} />

      <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        {f === 0 ? (
          <BaselineCard run={run} />
        ) : f >= EXAM_FRAME ? (
          <CriteriaTable criteria={run.exam.outcome.criteria} />
        ) : (
          <DemoDayCard day={day} />
        )}
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">speaker rating</p>
          <p className="font-mono text-5xl font-semibold tabular-nums text-accent">{rating}</p>
          <p className="font-mono text-xs text-muted">
            {rating - run.goal.ratingFrom >= 0 ? "+" : ""}
            {rating - run.goal.ratingFrom} of +{run.goal.ratingTarget - run.goal.ratingFrom} target
          </p>
          <RatingChart points={history} target={run.goal.ratingTarget} />
        </div>
      </section>

      {f >= 1 && f < EXAM_FRAME && (
        <div className="grid gap-5 md:grid-cols-3">
          <WeekProgress c={day.calendar} />
          <PayoutForecast day={day.day} stakeCents={JAKE.stakeCents} onTrack={day.calendar.goalReachable} />
          <CommunityFeed day={day.day} />
        </div>
      )}

      {f === PAYOUT_FRAME && (
        <div className="flex flex-col gap-5">
          <TestModeBanner />
          <section className="rounded-lg border border-accent/50 bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">day 30 · result</p>
            <h2 className="mt-2 text-3xl font-semibold">{won ? "Goal reached" : "Goal not reached"}</h2>
            <p className="mt-2 text-muted">
              {JAKE.name} gets {formatUsd(run.settlement.yourPayoutCents)} back for a {formatUsd(JAKE.stakeCents)} stake.
              Rating {run.baseline.rating} → {run.exam.change.after}, fillers {run.baseline.fillersPerMin.toFixed(1)} →{" "}
              {run.exam.metrics.fillersPerMin.toFixed(1)}/min, pace {run.baseline.wpm} → {run.exam.metrics.wpm} wpm, eye
              contact {JAKE.start.eyePct}% → {run.exam.eyeContactPct}%.
            </p>
          </section>
          <PayoutBreakdown s={run.settlement} stakeCents={JAKE.stakeCents} status={run.exam.outcome.status} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/baseline" className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink hover:opacity-90">
              Get your own Speaker Rating
            </Link>
            <Link href="/play" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
              Start a game in test mode
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function frameLabel(f: number): string {
  if (f === 0) return "Day 0 · 3-speech baseline";
  if (f === EXAM_FRAME) return "Day 30 · final exam";
  if (f === PAYOUT_FRAME) return "Day 30 · payout";
  const week = Math.min(Math.ceil(f / 7), KICKSTARTER.weeks.length);
  return `Day ${f} of ${KICKSTARTER.days} · week ${week}: ${KICKSTARTER.weeks[week - 1].theme}`;
}

function BaselineCard({ run }: { run: ReturnType<typeof runJakeDemo> }) {
  const b = run.baseline;
  return (
    <section className="flex min-h-56 flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">day 0 · baseline from 3 speeches</p>
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <div><dt className="text-xs text-muted">fillers/min</dt><dd>{b.fillersPerMin.toFixed(1)}</dd></div>
        <div><dt className="text-xs text-muted">pace</dt><dd>{b.wpm} wpm</dd></div>
        <div><dt className="text-xs text-muted">vocal variety</dt><dd>{b.pitchVariabilitySt?.toFixed(1)} st</dd></div>
        <div><dt className="text-xs text-muted">goal</dt><dd>{run.goal.ratingFrom} → {run.goal.ratingTarget}</dd></div>
      </dl>
      <p className="mt-auto text-sm text-muted">
        Exam targets are fixed: fillers ≤ 3/min, eye contact ≥ 60%, pace 130–165 wpm, and 24 of 30 practice days.
      </p>
    </section>
  );
}

type Clock = ReturnType<typeof useVirtualClock>;

function Controls({ clock, label }: { clock: Clock; label: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={clock.playing ? clock.pause : clock.play}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          {clock.playing ? "Pause" : clock.frame >= PAYOUT_FRAME ? "Replay" : clock.frame ? "Resume" : "Play 30 days"}
        </button>
        <div className="flex overflow-hidden rounded-md border border-line font-mono text-xs" role="group" aria-label="Speed">
          {[1, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => clock.setSpeed(s)}
              aria-pressed={clock.speed === s}
              className={`px-3 py-2 ${clock.speed === s ? "bg-raised text-text" : "text-muted hover:bg-raised"}`}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="font-mono text-sm" aria-live="polite">
          {label}
        </span>
      </div>
      <label className="flex items-center gap-3">
        <span className="sr-only">Jump to day</span>
        <input
          type="range"
          min={0}
          max={PAYOUT_FRAME}
          value={clock.frame}
          onChange={(e) => {
            clock.pause();
            clock.seek(Number(e.target.value));
          }}
          className="w-full accent-[var(--color-accent)]"
        />
      </label>
    </section>
  );
}
