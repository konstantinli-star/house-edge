"use client";

import Link from "next/link";
import { ratingHistory, DAILY_TARGET_TASKS } from "@/lib/game/journal";
import { formatUsd } from "@/lib/game/rules";
import { useGame } from "@/hooks/useGame";
import { EmptyGame } from "@/components/EmptyGame";
import { TestModeBanner } from "@/components/play/TestModeBanner";
import { CommunityFeed } from "./CommunityFeed";
import { PayoutForecast } from "./PayoutForecast";
import { RatingChart } from "./RatingChart";
import { ReminderOptIn } from "./ReminderOptIn";
import { WeekProgress } from "./WeekProgress";

export function Dashboard() {
  const { state } = useGame();
  if (state === null) return <p className="font-mono text-sm text-muted">loading…</p>;
  if (state === "none") return <EmptyGame />;

  const { entry, journal, calendar: c, rating, tasksToday, control, nextTask } = state;
  const { ratingFrom, ratingTarget } = entry.goal;
  const progress = Math.max(0, Math.min(1, (rating - ratingFrom) / (ratingTarget - ratingFrom)));
  const gameEnd = new Date(Date.parse(entry.createdAt) + (entry.goal.days - 1) * 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <TestModeBanner />

      <section className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              day {c.day} of {entry.goal.days} · {formatUsd(entry.stakeCents)} committed
            </p>
            <p className="mt-2 font-mono text-6xl font-semibold tabular-nums text-accent">{rating}</p>
            <p className="font-mono text-sm text-muted">
              Speaker Rating · {rating - ratingFrom >= 0 ? "+" : ""}
              {rating - ratingFrom} of +{ratingTarget - ratingFrom} target
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <TodayCard tasksToday={tasksToday} control={control} hasTask={Boolean(nextTask)} title={nextTask?.title} />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-sm text-accent">final exam</h2>
          <p className="mt-1 text-sm text-muted">
            Live, under camera and microphone. Fillers ≤ {entry.goal.exam.maxFillersPerMin}/min, eye contact ≥{" "}
            {entry.goal.exam.minEyeContactPct}%, pace {entry.goal.exam.paceMin}–{entry.goal.exam.paceMax} wpm.
          </p>
        </div>
        <Link href="/exam" className="shrink-0 rounded-md border border-line px-4 py-2 text-center text-sm hover:bg-raised">
          Go to the final exam
        </Link>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-3 font-mono text-sm text-accent">rating history</h2>
        <RatingChart points={ratingHistory(entry, journal)} target={ratingTarget} />
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <WeekProgress c={c} />
        <PayoutForecast day={c.day} stakeCents={entry.stakeCents} onTrack={c.goalReachable} commissionRate={entry.goal.commissionRate} />
        <ReminderOptIn gameEndDate={gameEnd} practicedToday={c.practicedToday} />
        <CommunityFeed day={c.day} />
      </div>
    </div>
  );
}

function TodayCard(p: { tasksToday: number; control: boolean; hasTask: boolean; title?: string }) {
  const done = p.tasksToday >= DAILY_TARGET_TASKS;
  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border border-accent/40 bg-surface p-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">today</p>
        <p className="mt-2 text-2xl font-semibold">
          {done ? "Today’s practice is done" : p.control ? "Control measurement" : (p.title ?? "Today’s task")}
        </p>
        <p className="mt-1 text-sm text-muted">
          {p.control
            ? "Your rating rose more than 120 in a week, so the next task is an unscheduled check."
            : `${Math.min(p.tasksToday, DAILY_TARGET_TASKS)} of ${DAILY_TARGET_TASKS} timed tasks · about 10–15 minutes`}
        </p>
      </div>
      {p.hasTask ? (
        <Link
          href="/exercise"
          className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink hover:opacity-90"
        >
          {done ? "One more rated task" : p.tasksToday ? "Next task" : "Start today’s task"}
        </Link>
      ) : (
        <p className="font-mono text-sm text-muted">Come back tomorrow.</p>
      )}
    </div>
  );
}
