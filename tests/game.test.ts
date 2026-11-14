import { describe, expect, it } from "vitest";
import { averageBaseline, deriveGoal } from "@/lib/game/baseline";
import { formatUsd, tierAvailable } from "@/lib/game/rules";
import { checkLiveness, randomPhrase } from "@/lib/proof/liveness";

describe("3-speech baseline", () => {
  it("averages takes and derives a rating", () => {
    const b = averageBaseline([
      { fillersPerMin: 8, wpm: 190, pitchVariabilitySt: 1.5, pausesPerMin: 1 },
      { fillersPerMin: 10, wpm: 184, pitchVariabilitySt: 1.7, pausesPerMin: 2 },
      { fillersPerMin: 9, wpm: 187, pitchVariabilitySt: null, pausesPerMin: 3 },
    ]);
    expect(b).toMatchObject({ fillersPerMin: 9, wpm: 187, pitchVariabilitySt: 1.6, pausesPerMin: 2, takes: 3 });
    expect(b.rating).toBeGreaterThan(400);
  });

  it("keeps exam thresholds absolute however bad the baseline is", () => {
    const g = deriveGoal(500);
    expect(g.exam).toEqual({ maxFillersPerMin: 3, paceMin: 130, paceMax: 165, minEyeContactPct: 60 });
    expect(g.ratingTarget).toBe(650);
    expect(g.minPracticeDays).toBe(24);
  });
});

describe("stake tiers", () => {
  it("caps the first stake at $100", () => {
    expect(tierAvailable(5000, 0)).toBe(true);
    expect(tierAvailable(10000, 0)).toBe(true);
    expect(tierAvailable(25000, 0)).toBe(false);
    expect(tierAvailable(25000, 1)).toBe(true);
    expect(tierAvailable(50000, 3)).toBe(false);
  });

  it("formats dollars", () => {
    expect(formatUsd(10000)).toBe("$100");
    expect(formatUsd(10350)).toBe("$103.50");
  });
});

describe("liveness", () => {
  it("passes when the phrase opens the transcript", () => {
    expect(checkLiveness("amber falcon seven harbor", "Amber, falcon, seven harbor. So today I want to talk").passed).toBe(true);
  });
  it("tolerates one misheard word", () => {
    expect(checkLiveness("amber falcon seven harbor", "amber falcon 7 harbor today").passed).toBe(true);
  });
  it("fails when the phrase is missing", () => {
    expect(checkLiveness("amber falcon seven harbor", "Today I want to talk about our sprint").passed).toBe(false);
  });
  it("generates distinct words", () => {
    expect(new Set(randomPhrase(4).split(" ")).size).toBe(4);
  });
});
