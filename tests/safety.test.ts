import { describe, expect, it } from "vitest";
import { canLiftExclusion, changeLimit, withinLimit, type SafetySettings } from "@/lib/safety";

const base: SafetySettings = { selfExcludedAt: null, stakeLimitCents: null, pendingLimit: null };
const now = new Date("2026-11-14T12:00:00Z");

describe("stake limit", () => {
  it("applies a stricter limit immediately", () => {
    expect(changeLimit(base, 5000, now).stakeLimitCents).toBe(5000);
  });

  it("delays raising or removing a limit by 24 hours", () => {
    const s = changeLimit({ ...base, stakeLimitCents: 5000 }, 10000, now);
    expect(s.stakeLimitCents).toBe(5000);
    expect(s.pendingLimit?.effectiveAt).toBe("2026-11-15T12:00:00.000Z");
    expect(changeLimit({ ...base, stakeLimitCents: 5000 }, null, now).stakeLimitCents).toBe(5000);
  });

  it("blocks stakes above the limit", () => {
    expect(withinLimit({ ...base, stakeLimitCents: 5000 }, 10000)).toBe(false);
    expect(withinLimit(base, 25000)).toBe(true);
  });
});

describe("self-exclusion", () => {
  it("can only be lifted after a 7-day cooling-off", () => {
    const s = { ...base, selfExcludedAt: "2026-11-10T12:00:00Z" };
    expect(canLiftExclusion(s, now)).toBe(false);
    expect(canLiftExclusion(s, new Date("2026-11-17T12:00:00Z"))).toBe(true);
  });
});
