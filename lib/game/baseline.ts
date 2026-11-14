// Full baseline for a stake: the average of 3 timed speeches (anti-sandbagging),
// and the goal derived from it. Exam thresholds are absolute, so a deliberately
// bad baseline cannot make the goal easier.

import { initialRating, scoreSpeech } from "@/lib/proof/score";
import { KICKSTARTER } from "./rules";

export type TakeSummary = {
  fillersPerMin: number;
  wpm: number;
  pitchVariabilitySt: number | null;
  pausesPerMin: number;
};

export type Baseline = TakeSummary & { composite: number; rating: number; takes: number };

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function averageBaseline(takes: TakeSummary[]): Baseline {
  if (takes.length === 0) throw new Error("No takes to average");
  const pitches = takes.map((t) => t.pitchVariabilitySt).filter((p): p is number => p != null);
  const summary: TakeSummary = {
    fillersPerMin: round1(avg(takes.map((t) => t.fillersPerMin))),
    wpm: Math.round(avg(takes.map((t) => t.wpm))),
    pitchVariabilitySt: pitches.length ? round1(avg(pitches)) : null,
    pausesPerMin: round1(avg(takes.map((t) => t.pausesPerMin))),
  };
  const { composite } = scoreSpeech(summary);
  return { ...summary, composite, rating: initialRating(composite), takes: takes.length };
}

export type Goal = {
  exam: { maxFillersPerMin: number; paceMin: number; paceMax: number; minEyeContactPct: number };
  minPracticeDays: number;
  days: number;
  ratingFrom: number;
  ratingTarget: number;
};

export function deriveGoal(baselineRating: number): Goal {
  const { exam, minPracticeDays, days, ratingGainTarget } = KICKSTARTER;
  return {
    exam: { ...exam },
    minPracticeDays,
    days,
    ratingFrom: baselineRating,
    ratingTarget: baselineRating + ratingGainTarget,
  };
}
