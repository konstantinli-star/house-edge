// Speaker Rating updates, chess-puzzle style.
// Each task has a difficulty D (800–1400). The attempt gets its own
// performance rating on the same scale as the Speaker Rating
// (400 + 12 × composite score), and scores P = 1 / (1 + 10^((D − perf) / 400)).
// Expected E = 1 / (1 + 10^((D − R) / 400)); new rating R' = R + K·(P − E).
// Performing at your level changes nothing; better performance raises the
// rating, and the rating converges to how you actually speak. Easy tasks pay
// little and cost a lot when failed, so the rating can't be farmed.

import { initialRating, scoreSpeech } from "@/lib/proof/score";

export const K_FACTOR = 32;
export const MIN_DIFFICULTY = 800;
export const MAX_DIFFICULTY = 1400;

export const expectedScore = (rating: number, difficulty: number) => 1 / (1 + 10 ** ((difficulty - rating) / 400));

export type TaskLimits = { fillerLimitPerMin: number; timeLimitSec: number };

export type AttemptMeasures = {
  fillersPerMin: number;
  wpm: number;
  pitchVariabilitySt: number | null;
  speakingSec: number;
  eyeContactPct?: number | null; // exam only (camera)
};

// The attempt's own rating: composite score, scaled down if the speaker used
// less than 80% of the task's time (a 15-second answer can't show much).
export function attemptRating(m: AttemptMeasures, task: TaskLimits): number {
  const { composite } = scoreSpeech(m);
  const timeUsed = Math.min(1, m.speakingSec / (0.8 * task.timeLimitSec));
  return initialRating(composite * timeUsed);
}

export function performanceScore(m: AttemptMeasures, task: TaskLimits & { difficulty: number }): number {
  return Math.round(expectedScore(attemptRating(m, task), task.difficulty) * 1000) / 1000;
}

export type RatingChange = { before: number; after: number; delta: number; expected: number; performance: number };

export function rateAttempt(rating: number, difficulty: number, performance: number): RatingChange {
  const expected = expectedScore(rating, difficulty);
  const after = Math.round(rating + K_FACTOR * (performance - expected));
  return {
    before: rating,
    after,
    delta: after - rating,
    expected: Math.round(expected * 1000) / 1000,
    performance,
  };
}
