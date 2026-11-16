import { describe, expect, it } from "vitest";
import { visibleChips } from "./chips";

const s = (question: string, id = question) => ({ question, screenshotId: id });

describe("visibleChips", () => {
  it("shows nothing while loading or empty", () => {
    expect(visibleChips(undefined, "", false)).toEqual([]);
    expect(visibleChips([], "", false)).toEqual([]);
  });

  it("shows nothing once the person is typing or an answer is on its way", () => {
    expect(visibleChips([s("When is the flyer?")], "wh", false)).toEqual([]);
    expect(visibleChips([s("When is the flyer?")], "", true)).toEqual([]);
  });

  it("trims, drops blank and repeated questions, and keeps at most three", () => {
    const list = [s(" When is the flyer? "), s("  "), s("When is the flyer?", "b"), s("How much is the bill?"), s("When is the exam?"), s("How much is the rent?")];
    expect(visibleChips(list, "", false).map((c) => c.question)).toEqual(["When is the flyer?", "How much is the bill?", "When is the exam?"]);
  });
});
