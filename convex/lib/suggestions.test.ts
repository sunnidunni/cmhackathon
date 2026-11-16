import { describe, expect, test } from "vitest";
import { suggestionsFrom } from "./suggestions";

const row = (over: object = {}) => ({
  id: "a",
  status: "ready",
  hidden: false,
  title: "Brightside Power bill",
  amount: "",
  importance: 3,
  readAt: 1,
  dates: [] as { when: string; what: string; confident: boolean }[],
  ...over,
});
const confident = [{ when: "2026-11-16", what: "due", confident: true }];

describe("suggestionsFrom", () => {
  test("a confident date gives a When question, an amount alone gives How much", () => {
    const out = suggestionsFrom([
      row({ id: "a", dates: confident }),
      row({ id: "b", title: "Drift Pro headphones", amount: "$99.00", importance: 2 }),
    ]);
    expect(out).toEqual([
      { question: "When is the Brightside Power bill?", screenshotId: "a" },
      { question: "How much is the Drift Pro headphones?", screenshotId: "b" },
    ]);
  });

  test("a screenshot with neither a confident date nor an amount gives nothing", () => {
    expect(suggestionsFrom([row({ dates: [{ when: "2026-11-16", what: "due", confident: false }] })])).toEqual([]);
  });

  test("skips unready, hidden, empty, long and number-bearing titles, and never puts a date or price in a question", () => {
    const out = suggestionsFrom([
      row({ id: "1", status: "failed", dates: confident }),
      row({ id: "2", hidden: true, dates: confident }),
      row({ id: "3", title: "  ", dates: confident }),
      row({ id: "4", title: "x".repeat(50), dates: confident }),
      row({ id: "5", title: "Power bill $142.37", dates: confident }),
      row({ id: "6", title: "Flyer Nov 16", dates: confident }),
      row({ id: "7", title: "Harvest Lantern Night", dates: confident }),
    ]);
    expect(out.map((s) => s.screenshotId)).toEqual(["7"]);
  });

  test("most important first, then most recent; at most 3; no duplicate questions", () => {
    const out = suggestionsFrom([
      row({ id: "a", title: "Alpha", dates: confident, importance: 2, readAt: 5 }),
      row({ id: "b", title: "Beta", dates: confident, importance: 5, readAt: 1 }),
      row({ id: "c", title: "Gamma", dates: confident, importance: 2, readAt: 9 }),
      row({ id: "d", title: "Delta", dates: confident, importance: 1, readAt: 9 }),
      row({ id: "e", title: "beta", dates: confident, importance: 4, readAt: 9 }),
    ]);
    expect(out.map((s) => s.screenshotId)).toEqual(["b", "c", "a"]);
  });

  test("an empty library gives an empty list", () => {
    expect(suggestionsFrom([])).toEqual([]);
  });
});
