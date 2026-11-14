// Speaker Rating updates, chess-puzzle style.
// Each task has a difficulty D (800–1400). The attempt earns a performance
// score P in [0, 1] against that task's own limits. Expected score
// E = 1 / (1 + 10^((D − R) / 400)); new rating R' = R + K·(P − E).
// Easy tasks give little (E is high); failing them costs a lot. Hard tasks pay.

import { paceScore, varietyScore } from "@/lib/proof/score";

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
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Performance against this task: fillers vs the task's limit weigh most.
export function performanceScore(m: AttemptMeasures, task: TaskLimits): number {
  // 1 at or under the limit, 0 at twice the limit.
  const fillers = clamp01((2 * task.fillerLimitPerMin - m.fillersPerMin) / task.fillerLimitPerMin);
  const pace = paceScore(m.wpm) / 100;
  const duration = clamp01(m.speakingSec / (0.8 * task.timeLimitSec)); // must use most of the time
  const parts: [number, number][] = [
    [fillers, 0.45],
    [pace, 0.3],
    [duration, 0.1],
  ];
  if (m.pitchVariabilitySt != null) parts.push([varietyScore(m.pitchVariabilitySt) / 100, 0.15]);
  const weight = parts.reduce((a, [, w]) => a + w, 0);
  return Math.round((parts.reduce((a, [v, w]) => a + v * w, 0) / weight) * 1000) / 1000;
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
