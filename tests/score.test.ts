import { describe, expect, it } from "vitest";
import {
  eyeContactScore,
  fillerScore,
  initialRating,
  paceScore,
  scoreSpeech,
  TARGETS,
  varietyScore,
  VARIETY_TARGET_ST,
} from "@/lib/proof/score";

describe("metric scores (50 = exam threshold)", () => {
  it("puts every exam threshold at exactly 50", () => {
    expect(fillerScore(TARGETS.maxFillersPerMin)).toBeCloseTo(50);
    expect(paceScore(TARGETS.paceMin)).toBeCloseTo(50);
    expect(paceScore(TARGETS.paceMax)).toBeCloseTo(50);
    expect(eyeContactScore(TARGETS.minEyeContactPct)).toBeCloseTo(50);
    expect(varietyScore(VARIETY_TARGET_ST)).toBeCloseTo(50);
  });

  it("gives 100 for no fillers and the middle of the pace band", () => {
    expect(fillerScore(0)).toBe(100);
    expect(paceScore(147.5)).toBe(100);
  });

  it("is monotonic: better speech always scores higher", () => {
    expect(fillerScore(1)).toBeGreaterThan(fillerScore(2));
    expect(paceScore(150)).toBeGreaterThan(paceScore(180));
    expect(eyeContactScore(80)).toBeGreaterThan(eyeContactScore(40));
    expect(varietyScore(4)).toBeGreaterThan(varietyScore(1.5));
  });
});

describe("composite and rating", () => {
  it("rates a speaker exactly at the exam bar at 1000", () => {
    const s = scoreSpeech({ fillersPerMin: 3, wpm: 130, pitchVariabilitySt: VARIETY_TARGET_ST, eyeContactPct: 60 });
    expect(initialRating(s.composite)).toBe(1000);
  });

  it("maps Jake's day-1 numbers to a rating near 812", () => {
    const s = scoreSpeech({ fillersPerMin: 9, wpm: 187, pitchVariabilitySt: 1.6, eyeContactPct: 31 });
    expect(Math.abs(initialRating(s.composite) - 812)).toBeLessThanOrEqual(10);
  });

  it("skips metrics that were not measured", () => {
    const s = scoreSpeech({ fillersPerMin: 3, wpm: 165, pitchVariabilitySt: null });
    expect(s.composite).toBeCloseTo(50, 0);
    expect(s.eyeContact).toBeNull();
  });

  it("uses R0 = 400 + 12 x composite", () => {
    expect(initialRating(0)).toBe(400);
    expect(initialRating(50)).toBe(1000);
    expect(initialRating(150)).toBe(1600);
  });
});
