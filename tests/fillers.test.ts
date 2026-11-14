import { describe, expect, it } from "vitest";
import { countWords, detectFillers } from "@/lib/proof/fillers";

describe("detectFillers", () => {
  it("counts hesitations and filler phrases", () => {
    const r = detectFillers("Umm, so, like, you know, I was, uh, thinking basically about it.");
    expect(r.hesitations).toBe(2);
    expect(r.byWord).toMatchObject({ "um/uh": 2, so: 1, like: 1, "you know": 1, basically: 1 });
    expect(r.total).toBe(6);
  });

  it("ignores normal uses of like, so and you know", () => {
    const r = detectFillers("I would like to show you something like this so that you know how it works");
    expect(r.total).toBe(0);
  });

  it("flags filler tokens for highlighting", () => {
    const r = detectFillers("this is um great");
    expect(r.tokens.map((t) => t.filler)).toEqual([false, false, true, false]);
  });

  it("counts words ignoring punctuation", () => {
    expect(countWords("Hello, world! It's  me.")).toBe(4);
  });
});
