// Turns raw metrics into 0–100 sub-scores, a composite, and a Speaker Rating.
// Thresholds mirror the final-exam targets so the rating and the goal agree.

export const TARGETS = {
  maxFillersPerMin: 3,
  paceMin: 130,
  paceMax: 165,
  minEyeContactPct: 60,
} as const;

export type ScoreInput = {
  fillersPerMin: number;
  wpm: number;
  pitchVariabilitySt: number | null;
  eyeContactPct?: number | null;
};

export type Scores = {
  fillers: number;
  pace: number;
  variety: number | null;
  eyeContact: number | null;
  composite: number;
};

const WEIGHTS = { fillers: 0.35, pace: 0.25, eyeContact: 0.25, variety: 0.15 };

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

// 100 at ≤ 1 filler/min, 0 at ≥ 12/min.
export const fillerScore = (perMin: number) => clamp(((12 - perMin) / 11) * 100);

// 100 inside the target band, losing 100 points per 60 wpm outside it.
export function paceScore(wpm: number) {
  const outside = wpm < TARGETS.paceMin ? TARGETS.paceMin - wpm : wpm > TARGETS.paceMax ? wpm - TARGETS.paceMax : 0;
  return clamp(100 - (outside / 60) * 100);
}

// Pitch spread: ≤ 1 semitone sounds flat (0), ≥ 4 semitones sounds lively (100).
export const varietyScore = (st: number) => clamp(((st - 1) / 3) * 100);

// 100 at ≥ 80% eye contact, 0 at ≤ 10%.
export const eyeContactScore = (pct: number) => clamp(((pct - 10) / 70) * 100);

// Weighted average over the metrics we actually measured (missing ones are skipped).
export function scoreSpeech(input: ScoreInput): Scores {
  const parts = {
    fillers: fillerScore(input.fillersPerMin),
    pace: paceScore(input.wpm),
    variety: input.pitchVariabilitySt == null ? null : varietyScore(input.pitchVariabilitySt),
    eyeContact: input.eyeContactPct == null ? null : eyeContactScore(input.eyeContactPct),
  };

  let sum = 0;
  let weight = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    const value = parts[key];
    if (value == null) continue;
    sum += value * WEIGHTS[key];
    weight += WEIGHTS[key];
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    fillers: round1(parts.fillers),
    pace: round1(parts.pace),
    variety: parts.variety == null ? null : round1(parts.variety),
    eyeContact: parts.eyeContact == null ? null : round1(parts.eyeContact),
    composite: round1(weight ? sum / weight : 0),
  };
}

// Initial (provisional) Speaker Rating from a baseline composite: 400–1600.
export const initialRating = (composite0to100: number) => Math.round(400 + 12 * clamp(composite0to100));
