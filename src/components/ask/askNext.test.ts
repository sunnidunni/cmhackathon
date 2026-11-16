import { describe, expect, it } from "vitest";
import { askNext, fixtureNextAnswer, reminderNote } from "./askNext";

const date = (when: string, what: string) => ({ when, what, confident: true });

describe("askNext", () => {
  it("uses the flyer's own follow-ups for the demo screenshot", () => {
    const shot = { _id: "01-pottery-flyer", title: "Pottery night", amount: null, dates: [] };
    expect(askNext(shot, null, true).map((q) => q.question)).toEqual(["Where is the class?", "How much is it?", "When is the class?"]);
    expect(askNext(shot, null, false).map((q) => q.question)).toEqual(["What else does it say?"]);
  });

  it("asks about other dates and the price, never the date just answered", () => {
    const shot = { _id: "x", title: "Pottery night", amount: "$42", dates: [date("2026-11-20", "Sign-up closes"), date("2026-11-27", "Pottery night"), { when: "2026-12-01", what: "Maybe", confident: false }] };
    expect(askNext(shot, "2026-11-20", false).map((q) => q.question)).toEqual(["When is Pottery night?", "How much is it?", "What else does it say?"]);
  });

  it("caps at three", () => {
    const shot = { _id: "x", title: "T", amount: "$1", dates: [date("a", "A"), date("b", "B"), date("c", "C")] };
    expect(askNext(shot, null, false)).toHaveLength(3);
  });
});

describe("fixtureNextAnswer", () => {
  it("answers demo follow-ups from the flyer and nothing else", () => {
    expect(fixtureNextAnswer("where is the class?", "01-pottery-flyer")).toBe("18 Alder Lane, at Clay Harbor Studio.");
    expect(fixtureNextAnswer("Where is the class?", "other")).toBeNull();
  });
});

describe("reminderNote", () => {
  it("says it closes only for closing dates", () => {
    expect(reminderNote("Pottery class sign-up closes")).toBe("The day before it closes. One reminder. Change it or turn it off later.");
    expect(reminderNote("Assignment 2 due")).toBe("The day before. One reminder. Change it or turn it off later.");
  });
});
