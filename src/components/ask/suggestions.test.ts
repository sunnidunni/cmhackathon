import { describe, expect, it } from "vitest";
import manifest from "../../../demo-screenshots/manifest.json";
import { answerFrom, POTTERY_QUESTION, suggestionsFrom, visibleChips, type SuggestionRow } from "./suggestions";

const row = (o: Partial<SuggestionRow>): SuggestionRow => ({ id: o.title ?? "x", ...o });
const date = (when: string, what = "Thing") => ({ when, what, confident: true });
const s = (question: string) => ({ question, screenshotId: question });

describe("suggestionsFrom", () => {
  it("builds questions from dated or priced titles, most important first", () => {
    const rows = [
      row({ title: "Energy bill", amount: "$84.20", importance: 2 }),
      row({ title: "Juniper Vale concert", dates: [date("2026-11-22T20:00:00")], importance: 5 }),
      row({ title: "Assignment due", dates: [date("2026-11-25")], importance: 4 }),
    ];
    expect(suggestionsFrom(rows).map((x) => x.question)).toEqual(["When is the Juniper Vale concert?", "When is the assignment due?", "How much is the energy bill?"]);
  });

  it("skips titles with digits, prices, no facts, unconfident dates, or repeats", () => {
    const rows = [
      row({ id: "a", title: "Flight SL 208", dates: [date("2026-11-22")] }),
      row({ id: "b", title: "Wi-Fi password" }),
      row({ id: "c", title: "Party", dates: [{ when: "2026-11-21", what: "Party", confident: false }] }),
      row({ id: "d", title: "Rent split", amount: "$900" }),
      row({ id: "e", title: "Rent split", amount: "$900" }),
    ];
    expect(suggestionsFrom(rows)).toEqual([{ question: "How much is the rent split?", screenshotId: "d" }]);
  });
});

describe("answerFrom", () => {
  it("answers a suggested question from the row it came from", () => {
    const rows = [row({ id: "visa", title: "Visa photo appointment", dates: [date("2026-12-04T09:15:00", "Visa photo appointment")] })];
    expect(answerFrom(" when is the visa photo appointment? ", rows)).toEqual({ answer: "Visa photo appointment Fri, Dec 4.", screenshotId: "visa" });
    expect(answerFrom("What was that recipe?", rows)).toBeNull();
  });

  it("answers every chip the demo screenshots produce", () => {
    const rows = manifest.map((m) => ({ id: m.file, title: m.title, dates: m.dates, importance: m.importance }));
    const chips = suggestionsFrom(rows);
    expect(chips.length).toBeGreaterThan(2);
    for (const c of chips) expect(answerFrom(c.question, rows)?.screenshotId).toBe(c.screenshotId);
  });
});

describe("visibleChips", () => {
  it("keeps the pottery question first and shows at most three", () => {
    const out = visibleChips([s("When is the exam?"), s("When is the trip?"), s("When is the bill?")], [], "", false);
    expect(out.map((c) => c.question)).toEqual([POTTERY_QUESTION, "When is the exam?", "When is the trip?"]);
  });

  it("drops questions already asked", () => {
    const out = visibleChips([s("When is the exam?")], [POTTERY_QUESTION.toUpperCase()], "", false);
    expect(out.map((c) => c.question)).toEqual(["When is the exam?"]);
  });

  it("hides while typing or answering", () => {
    expect(visibleChips([s("When is the exam?")], [], "wh", false)).toEqual([]);
    expect(visibleChips([s("When is the exam?")], [], "", true)).toEqual([]);
  });
});
