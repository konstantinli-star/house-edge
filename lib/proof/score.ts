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

// Every metric maps to 0–100 with exactly 50 at the exam threshold, so a
// composite of 50 (Speaker Rating 1000) means "meets the bar". 100 is reserved
// for excellent; scores fall off gently, so a struggling speaker sits near 30–35.
// score = 100 / (1 + ratio^k), where ratio = 1 at the threshold.
const falloff = (ratio: number, k: number) => 100 / (1 + Math.max(ratio, 0) ** k);

// Steepness: chosen so that 3× worse than the threshold scores ~34 (Jake's start).
const K = { fillers: 0.6, pace: 0.82, eye: 1, variety: 1.5 };

// Vocal variety: 2.5 semitones of pitch spread is "some variety" (score 50).
export const VARIETY_TARGET_ST = 2.5;

// 50 at 3 fillers/min, 100 at none.
export const fillerScore = (perMin: number) => falloff(perMin / TARGETS.maxFillersPerMin, K.fillers);

// 100 in the middle of the 130–165 band, 50 at its edges.
export function paceScore(wpm: number) {
  const center = (TARGETS.paceMin + TARGETS.paceMax) / 2;
  const halfBand = (TARGETS.paceMax - TARGETS.paceMin) / 2;
  return falloff(Math.abs(wpm - center) / halfBand, K.pace);
}

// 50 at 2.5 semitones of pitch spread; flat delivery scores low.
export const varietyScore = (st: number) => falloff(VARIETY_TARGET_ST / Math.max(st, 0.1), K.variety);

// 50 at 60% eye contact.
export const eyeContactScore = (pct: number) => falloff(TARGETS.minEyeContactPct / Math.max(pct, 1), K.eye);

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
