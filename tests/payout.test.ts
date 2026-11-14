// Exact numbers from the product spec (section 4).
import { describe, expect, it } from "vitest";
import { OPEN_GAME_COMMISSION, settlePool, SUBSCRIBER_COMMISSION, winnerPayout } from "@/lib/game/payout";

// 100 players × $100, the first `winners` of them reach the goal.
const pool = (winners: number) =>
  Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, stakeCents: 10000, won: i < winners }));

const dollars = (cents: number) => cents / 100;

describe("open game (15% commission from losers' money only)", () => {
  it.each([
    [50, 1500, 170.0],
    [70, 1500, 121.43],
    [90, 1000, 100.0],
    [100, 0, 100.0],
  ])("%i%% win → commission $%i, winner gets $%f", (winPct, commission, payout) => {
    const s = settlePool(pool(winPct), OPEN_GAME_COMMISSION);
    expect(dollars(s.bankCents)).toBe(10000);
    expect(dollars(s.commissionCents)).toBe(commission);
    expect(dollars(s.payouts.p0)).toBe(payout);
  });
});

describe("subscribers (0% commission)", () => {
  it.each([
    [50, 200.0],
    [70, 142.86],
    [90, 111.11],
  ])("%i%% win → winner gets $%f", (winPct, payout) => {
    expect(dollars(settlePool(pool(winPct), SUBSCRIBER_COMMISSION).payouts.p0)).toBe(payout);
  });
});

describe("mixed stakes", () => {
  it("splits $2,000 left after fees by stake among $10,000 of winners", () => {
    expect(dollars(winnerPayout(10000, 1000000, 200000))).toBe(120);
    expect(dollars(winnerPayout(25000, 1000000, 200000))).toBe(300);
  });
});

describe("edge cases", () => {
  it("everyone wins → stakes back, no commission", () => {
    const s = settlePool(pool(100), OPEN_GAME_COMMISSION);
    expect(s.commissionCents).toBe(0);
    expect(Object.values(s.payouts).every((p) => p === 10000)).toBe(true);
  });

  it("nobody wins → whole bank rolls over, no division by zero", () => {
    const s = settlePool(pool(0), OPEN_GAME_COMMISSION);
    expect(s.rolloverCents).toBe(1000000);
    expect(s.payouts).toEqual({});
    expect(winnerPayout(10000, 0, 5000)).toBe(0);
  });

  it("never pays a winner less than their stake", () => {
    for (let w = 1; w <= 100; w++) {
      expect(settlePool(pool(w), OPEN_GAME_COMMISSION).payouts.p0).toBeGreaterThanOrEqual(10000);
    }
  });
});
