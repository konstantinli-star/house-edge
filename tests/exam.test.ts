import { describe, expect, it } from "vitest";
import { evaluateExam, EXAM_DIFFICULTY, type ExamInput } from "@/lib/game/exam";
import { finalSettlement, simulatedPool } from "@/lib/game/pool";
import { eyeContactPct, readGaze, type Point } from "@/lib/vision/gaze";

const passing: ExamInput = { fillersPerMin: 2.1, wpm: 152, eyeContactPct: 68, speakingSec: 85, practiceDays: 26, flags: {} };

describe("final exam", () => {
  it("wins only when every criterion passes", () => {
    const r = evaluateExam(passing);
    expect(r).toMatchObject({ examPassed: true, goalReached: true, status: "won" });
  });

  it.each([
    ["fillers", { fillersPerMin: 3.4 }],
    ["eye contact", { eyeContactPct: 55 }],
    ["pace too fast", { wpm: 170 }],
    ["too short", { speakingSec: 40 }],
    ["no camera", { eyeContactPct: null }],
  ])("fails on %s", (_, change) => {
    expect(evaluateExam({ ...passing, ...change }).status).toBe("lost");
  });

  it("passes the exam but loses the game with too few practice days", () => {
    const r = evaluateExam({ ...passing, practiceDays: 20 });
    expect(r).toMatchObject({ examPassed: true, goalReached: false, status: "lost" });
  });

  it("sends a flagged winning exam to review instead of paying out", () => {
    expect(evaluateExam({ ...passing, flags: { leftTab: true } }).status).toBe("appeal_review");
  });

  it("is a hard task", () => {
    expect(EXAM_DIFFICULTY).toBeGreaterThan(1200);
  });
});

describe("final settlement", () => {
  const pool = simulatedPool("kickstarter-2026-11");

  it("pays a winner at least their stake", () => {
    const s = finalSettlement(pool, 30, { stakeCents: 10000, won: true });
    expect(s.yourPayoutCents).toBeGreaterThan(10000);
    expect(s.players).toBe(100);
  });

  it("pays nothing to a player who missed the goal, and their stake helps winners", () => {
    const lost = finalSettlement(pool, 30, { stakeCents: 10000, won: false });
    const won = finalSettlement(pool, 30, { stakeCents: 10000, won: true });
    expect(lost.yourPayoutCents).toBe(0);
    expect(lost.losersCents).toBe(won.losersCents + 10000);
  });
});

// Synthetic 478-point face: everything centred, then move irises or nose.
function face(opts: { irisDx?: number; noseDx?: number } = {}): Point[] {
  const lm: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  const set = (i: number, x: number, y: number) => (lm[i] = { x, y });
  set(33, 0.35, 0.45); set(133, 0.45, 0.45); set(159, 0.4, 0.43); set(145, 0.4, 0.47); // right eye
  set(362, 0.55, 0.45); set(263, 0.65, 0.45); set(386, 0.6, 0.43); set(374, 0.6, 0.47); // left eye
  set(468, 0.4 + (opts.irisDx ?? 0), 0.45); set(473, 0.6 + (opts.irisDx ?? 0), 0.45);
  set(234, 0.3, 0.5); set(454, 0.7, 0.5); set(10, 0.5, 0.3); set(152, 0.5, 0.8);
  set(1, 0.5 + (opts.noseDx ?? 0), 0.55);
  return lm;
}

describe("gaze", () => {
  it("counts a centred face and irises as eye contact", () => {
    expect(readGaze(face())?.looking).toBe(true);
  });
  it("rejects eyes turned to the side", () => {
    expect(readGaze(face({ irisDx: 0.03 }))?.looking).toBe(false);
  });
  it("rejects a turned head", () => {
    expect(readGaze(face({ noseDx: 0.1 }))?.looking).toBe(false);
  });
  it("counts frames without a face as not looking", () => {
    expect(eyeContactPct({ frames: 10, faceFrames: 8, lookingFrames: 6, multiFaceFrames: 0 })).toBe(60);
  });
});
