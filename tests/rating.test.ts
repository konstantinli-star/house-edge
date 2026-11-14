import { describe, expect, it } from "vitest";
import { expectedScore, performanceScore, rateAttempt } from "@/lib/game/rating";
import { generateTask, taskDifficulty } from "@/lib/game/tasks";

const task = { fillerLimitPerMin: 4, timeLimitSec: 60 };
const good = { fillersPerMin: 1, wpm: 150, pitchVariabilitySt: 3.5, speakingSec: 58 };
const bad = { fillersPerMin: 10, wpm: 200, pitchVariabilitySt: 1, speakingSec: 20 };

describe("Elo rating", () => {
  it("uses E = 1 / (1 + 10^((D - R) / 400))", () => {
    expect(expectedScore(1000, 1000)).toBe(0.5);
    expect(expectedScore(800, 1200)).toBeCloseTo(0.0909, 3);
  });

  it("applies R' = R + 32 (P - E)", () => {
    expect(rateAttempt(1000, 1000, 1).after).toBe(1016);
    expect(rateAttempt(1000, 1000, 0).after).toBe(984);
  });

  it("pays more for solving hard tasks than easy ones", () => {
    const hard = rateAttempt(900, 1200, 0.9).delta;
    const easy = rateAttempt(900, 800, 0.9).delta;
    expect(hard).toBeGreaterThan(easy);
    expect(easy).toBeLessThan(10); // can't farm easy tasks
  });

  it("costs rating to fail an easy task", () => {
    expect(rateAttempt(1100, 850, 0.3).delta).toBeLessThan(-15);
  });

  it("scores performance against the task's limits", () => {
    expect(performanceScore(good, task)).toBeGreaterThan(0.9);
    expect(performanceScore(bad, task)).toBeLessThan(0.2);
  });
});

describe("tasks", () => {
  it("keeps difficulty within 800–1400", () => {
    expect(taskDifficulty(6, 45, 1)).toBe(800);
    expect(taskDifficulty(2, 120, 3)).toBe(1400);
  });

  it("adapts difficulty to the player's rating", () => {
    const base = { entryId: "e1", date: "2026-11-15", slot: 0, week: 1 };
    const low = generateTask({ ...base, rating: 812 });
    const high = generateTask({ ...base, rating: 1250 });
    expect(high.difficulty).toBeGreaterThan(low.difficulty);
    expect(Math.abs(low.difficulty - 837)).toBeLessThan(80);
    expect(high.fillerLimitPerMin).toBeLessThan(low.fillerLimitPerMin);
  });

  it("is stable for the same day and slot, different across slots", () => {
    const a = generateTask({ entryId: "e1", date: "2026-11-15", slot: 0, week: 2, rating: 900 });
    const b = generateTask({ entryId: "e1", date: "2026-11-15", slot: 0, week: 2, rating: 900 });
    const c = generateTask({ entryId: "e1", date: "2026-11-15", slot: 1, week: 2, rating: 900 });
    expect(a).toEqual(b);
    expect(a.kind).toBe("structure");
    expect(c.phrase).not.toBe(a.phrase);
  });
});
