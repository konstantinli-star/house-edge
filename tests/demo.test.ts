import { describe, expect, it } from "vitest";
import { JAKE, jakeTranscript, runJakeDemo } from "@/lib/demo/jake";
import { detectFillers } from "@/lib/proof/fillers";
import { seededRandom } from "@/lib/game/tasks";

describe("Jake's 30-day demo (real pipeline)", () => {
  const run = runJakeDemo();

  it("starts near the persona's 812 rating", () => {
    expect(Math.abs(run.baseline.rating - 812)).toBeLessThanOrEqual(15);
    expect(run.baseline.fillersPerMin).toBeGreaterThanOrEqual(8);
  });

  it("practises 26 of 30 days and gains about +150 to +250", () => {
    expect(run.days.at(-1)!.calendar.practiceDays).toBe(30 - JAKE.missedDays.length);
    const gain = run.exam.change.after - run.baseline.rating;
    expect(gain).toBeGreaterThanOrEqual(150);
    expect(gain).toBeLessThanOrEqual(250);
  });

  it("passes the exam and gets more than the stake back", () => {
    expect(run.exam.outcome.status).toBe("won");
    expect(run.settlement.yourPayoutCents).toBeGreaterThan(JAKE.stakeCents);
  });

  it("shows recovery after a missed day (week 1 still reachable)", () => {
    expect(run.days[5].practiced).toBe(false); // day 6
    expect(run.days[6].calendar.weekReachable).toBe(true); // day 7
  });

  it("is deterministic", () => {
    expect(runJakeDemo().history).toEqual(run.history);
  });

  it("builds transcripts whose fillers the real detector finds", () => {
    const text = jakeTranscript(150, 8, seededRandom("t"));
    expect(detectFillers(text).total).toBe(8);
  });
});
