"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveAttempt, withoutTokens } from "@/lib/attempts";
import { addRecord, DAILY_TARGET_TASKS, MAX_RATED_TASKS_PER_DAY } from "@/lib/game/journal";
import { performanceScore, rateAttempt, type RatingChange } from "@/lib/game/rating";
import type { Task } from "@/lib/game/tasks";
import { checkLiveness } from "@/lib/proof/liveness";
import type { SpeechMetrics } from "@/lib/proof/metrics";
import { useGame } from "@/hooks/useGame";
import { useSpeechSupport } from "@/hooks/useSpeechSupport";
import { useSpeechTake } from "@/hooks/useSpeechTake";
import { Notice, UnsupportedNotice } from "@/components/baseline/Notice";
import { RecordingPanel } from "@/components/baseline/RecordingPanel";
import { EmptyGame } from "@/components/EmptyGame";
import { TaskCard } from "./TaskCard";
import { TaskResult } from "./TaskResult";

type Done = { task: Task; metrics: SpeechMetrics; change: RatingChange | null; note?: string };

const MIN_SEC = 15;

export function ExerciseFlow() {
  const { state, refresh } = useGame();
  const support = useSpeechSupport();
  const game = state && state !== "none" ? state : null;
  const task = game?.nextTask ?? null;
  const take = useSpeechTake(task?.timeLimitSec ?? 60);
  const [done, setDone] = useState<Done | null>(null);

  // Score the finished take against the task, update the rating, save everything.
  useEffect(() => {
    if (take.phase !== "done" || !take.result || !game || !task || done) return;
    const { metrics, transcript } = take.result;
    const liveness = checkLiveness(task.phrase, transcript);
    const flags: Record<string, boolean> = liveness.passed ? {} : { livenessPhraseMissing: true };
    const attemptId = crypto.randomUUID();
    const strict = task.kind === "control";
    const rated = liveness.passed || !strict; // daily tasks are soft, control checks are strict

    const change = rated ? rateAttempt(game.rating, task.difficulty, performanceScore(metrics, task)) : null;
    saveAttempt({
      id: attemptId,
      kind: "daily",
      topic: task.topic,
      phrase: task.phrase,
      transcript,
      metrics: withoutTokens(metrics),
      flags,
      createdAt: new Date().toISOString(),
    });
    if (change) {
      addRecord({
        entryId: game.entry.id,
        date: game.today,
        attemptId,
        taskId: task.id,
        taskKind: task.kind,
        difficulty: task.difficulty,
        change,
        flags,
        createdAt: new Date().toISOString(),
      });
    }
    setDone({
      task,
      metrics,
      change,
      note: !liveness.passed
        ? strict
          ? "Control check not rated: we didn’t hear the opening phrase. Please record it again."
          : "Flagged: we didn’t hear the opening phrase. The task counts; flagged attempts can be reviewed."
        : undefined,
    });
    refresh();
  }, [take.phase, take.result, game, task, done, refresh]);

  const next = () => {
    setDone(null);
    take.reset();
  };

  if (state === null) return <p className="font-mono text-sm text-muted">loading…</p>;
  if (state === "none") return <EmptyGame />;
  if (support === "no-mic" || support === "no-transcript") return <UnsupportedNotice support={support} />;

  if (done) {
    return <TaskResult {...done} onNext={game?.nextTask ? next : undefined} />;
  }

  if (!task) return <DoneForToday tasksToday={game!.tasksToday} finished={game!.calendar.finished} />;

  if (take.phase === "denied" || take.phase === "error") {
    return (
      <Notice
        title={take.phase === "denied" ? "Microphone access is blocked" : "We couldn’t score that take"}
        action={{ label: "Try again", onClick: take.reset }}
      >
        {take.phase === "denied"
          ? "Allow the microphone for this site (the icon in your address bar), then try again."
          : take.error}
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-xs text-muted">
        task {game!.tasksToday + 1} of {DAILY_TARGET_TASKS} today · up to {MAX_RATED_TASKS_PER_DAY} rated
      </p>
      <TaskCard task={task} rating={game!.rating} />
      <RecordingPanel
        topic={task.topic}
        phrase={task.phrase}
        phase={take.phase}
        elapsed={take.elapsed}
        limitSec={task.timeLimitSec}
        minSec={Math.min(MIN_SEC, task.timeLimitSec)}
        level={take.level}
        captions={take.captions}
        onStart={take.start}
        onFinish={take.finish}
        disabled={support === "checking"}
      />
    </div>
  );
}

function DoneForToday({ tasksToday, finished }: { tasksToday: number; finished: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">{finished ? "The practice month is over" : "Done for today"}</h2>
      <p className="text-sm text-muted">
        {finished
          ? "Your final exam decides the game."
          : `You completed ${tasksToday} rated tasks today. Short daily sessions beat long ones; come back tomorrow.`}
      </p>
      <Link href="/dashboard" className="w-fit rounded-md border border-line px-4 py-2 text-sm hover:bg-raised">
        Back to dashboard
      </Link>
    </div>
  );
}
