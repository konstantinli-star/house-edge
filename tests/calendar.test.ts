import { describe, expect, it } from "vitest";
import { gameCalendar } from "@/lib/game/calendar";
import { communityFeed, payoutForecast, POOL_SIZE, simulatedPool } from "@/lib/game/pool";

const start = "2026-11-01";
const dates = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `2026-11-${String(from + i).padStart(2, "0")}`);

describe("game calendar", () => {
  it("counts the day, streak and week", () => {
    const c = gameCalendar(start, dates(1, 5), "2026-11-05");
    expect(c).toMatchObject({ day: 5, week: 1, streak: 5, practicedToday: true, weekDone: 5 });
  });

  it("keeps yesterday's streak alive until today is over", () => {
    expect(gameCalendar(start, dates(1, 4), "2026-11-05").streak).toBe(4);
    expect(gameCalendar(start, dates(1, 3), "2026-11-05").streak).toBe(0);
  });

  it("shows what can still be recovered this week", () => {
    // Day 5, practised days 1 and 2 only: 2 done, days 5–7 left → 5 of 6 max.
    const c = gameCalendar(start, dates(1, 2), "2026-11-05");
    expect(c).toMatchObject({ weekDone: 2, weekDaysLeft: 3, weekReachable: false, missedThisWeek: 2 });
    // Day 3 after missing day 2: 1 done + 5 left = 6 → still reachable.
    expect(gameCalendar(start, ["2026-11-01"], "2026-11-03").weekReachable).toBe(true);
  });

  it("knows when 24 of 30 days is out of reach", () => {
    const c = gameCalendar(start, dates(1, 10), "2026-11-25"); // 10 done, 6 days left
    expect(c.daysNeeded).toBe(14);
    expect(c.goalReachable).toBe(false);
  });

  it("puts days 22–30 in week 4", () => {
    expect(gameCalendar(start, [], "2026-11-30").week).toBe(4);
  });
});

describe("simulated pool", () => {
  it("is deterministic with 99 players", () => {
    expect(simulatedPool("g")).toEqual(simulatedPool("g"));
    expect(simulatedPool("g")).toHaveLength(POOL_SIZE);
  });

  it("forecasts a payout of at least your stake", () => {
    const f = payoutForecast(simulatedPool("kickstarter-2026-11"), 10, { stakeCents: 10000 });
    expect(f.payoutCents).toBeGreaterThanOrEqual(10000);
    expect(f.players).toBe(100);
    expect(f.projectedWinners).toBeLessThanOrEqual(f.active);
  });

  it("builds a feed without quit events", () => {
    const feed = communityFeed(simulatedPool("g"), 8);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((f) => !/quit|left|gave up/i.test(f.text))).toBe(true);
  });
});
