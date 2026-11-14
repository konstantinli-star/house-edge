import { describe, expect, it } from "vitest";
import { buildEntry } from "@/lib/game/entry";
import { controlRequired, type PracticeRecord } from "@/lib/game/journal";

const entry = buildEntry("e1", 10000, { fillersPerMin: 9, wpm: 187, pitchVariabilitySt: 1.6, pausesPerMin: 1, composite: 34, rating: 812, takes: 3 }, "local");

const rec = (date: string, after: number, taskKind = "filler-free"): PracticeRecord => ({
  entryId: "e1",
  date,
  attemptId: date,
  taskId: date,
  taskKind,
  difficulty: 850,
  change: { before: 0, after, delta: 0, expected: 0.5, performance: 0.5 },
  flags: {},
  createdAt: date,
});

describe("sudden jump check", () => {
  it("does not trigger on steady progress", () => {
    expect(controlRequired(entry, [rec("2026-11-02", 840), rec("2026-11-03", 870)], "2026-11-04")).toBe(false);
  });

  it("triggers when rating rises more than 120 in a week", () => {
    const j = [rec("2026-11-02", 880), rec("2026-11-03", 940)];
    expect(controlRequired(entry, j, "2026-11-04")).toBe(true);
  });

  it("is cleared by a control measurement", () => {
    const j = [rec("2026-11-02", 880), rec("2026-11-03", 940), rec("2026-11-04", 945, "control")];
    expect(controlRequired(entry, j, "2026-11-04")).toBe(false);
  });
});
