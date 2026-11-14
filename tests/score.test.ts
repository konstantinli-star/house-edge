import { describe, expect, it } from "vitest";
import { fillerScore, initialRating, paceScore, scoreSpeech } from "@/lib/proof/score";

describe("scoring", () => {
  it("scores pace inside the 130-165 band as 100", () => {
    expect(paceScore(130)).toBe(100);
    expect(paceScore(165)).toBe(100);
    expect(paceScore(195)).toBe(50);
    expect(paceScore(40)).toBe(0);
  });

  it("scores fillers from 1/min (100) to 12/min (0)", () => {
    expect(fillerScore(1)).toBe(100);
    expect(fillerScore(12)).toBe(0);
  });

  it("skips metrics that were not measured", () => {
    const s = scoreSpeech({ fillersPerMin: 1, wpm: 150, pitchVariabilitySt: null });
    expect(s.composite).toBe(100);
    expect(s.eyeContact).toBeNull();
  });

  it("maps Jake's day-1 numbers to a rating near 812", () => {
    const s = scoreSpeech({ fillersPerMin: 9, wpm: 187, pitchVariabilitySt: 1.6, eyeContactPct: 31 });
    expect(Math.abs(initialRating(s.composite) - 812)).toBeLessThanOrEqual(40);
  });

  it("uses R0 = 400 + 12 x composite", () => {
    expect(initialRating(0)).toBe(400);
    expect(initialRating(50)).toBe(1000);
    expect(initialRating(150)).toBe(1600);
  });
});
