import { describe, expect, test } from "vitest";
import { parseExtraction } from "./extraction";
import { pickToImport } from "./importPlan";
import { PLAYFUL_KEYS, SERIOUS_KEYS } from "./lines";
import manifest from "../../src/content/manifest.json";

const LONG_AGO = Date.UTC(2020, 0, 1);
const base = {
  title: "Harvest Lantern Night",
  text: "Harvest Lantern Night Nov 16 6:30pm",
  summary: "A lantern festival.",
  category: "deadlines",
  reason: "Event with a date",
  dates: [{ when: "2026-11-16T18:30", what: "event", confident: true }],
  importance: 4,
  reactionKey: "deadlines_03",
};

describe("playful keys", () => {
  test("only the _01 to _08 keys, never _s", () => {
    expect(PLAYFUL_KEYS.deadlines).toEqual(
      Array.from({ length: 8 }, (_, i) => `deadlines_0${i + 1}`),
    );
    expect(PLAYFUL_KEYS.unsorted.every((k) => !k.includes("_s"))).toBe(true);
  });
});

describe("parseExtraction", () => {
  test("accepts a good reply", () => {
    expect(parseExtraction(JSON.stringify(base))).toMatchObject(base);
  });
  test("accepts a fenced reply", () => {
    expect(parseExtraction("```json\n" + JSON.stringify(base) + "\n```").title).toBe(base.title);
  });
  test("rejects non JSON", () => {
    expect(() => parseExtraction("sorry")).toThrow();
  });
  test("bad category becomes unsorted with importance 1", () => {
    const r = parseExtraction(JSON.stringify({ ...base, category: "fun" }));
    expect(r.category).toBe("unsorted");
    expect(r.importance).toBe(1);
    expect(PLAYFUL_KEYS.unsorted).toContain(r.reactionKey);
  });
  test("bad reactionKey falls back to a playful key of the room", () => {
    for (const reactionKey of ["deadlines_s01", "money_01", "made up joke"]) {
      const r = parseExtraction(JSON.stringify({ ...base, reactionKey }));
      expect(r.reactionKey).toBe("deadlines_01");
    }
  });
  test("a date without a year is not confident", () => {
    const r = parseExtraction(
      JSON.stringify({ ...base, dates: [{ when: "11-21", what: "hike", confident: true }] }),
    );
    expect(r.dates[0].confident).toBe(false);
  });
  test("importance is clamped", () => {
    expect(parseExtraction(JSON.stringify({ ...base, importance: 9 })).importance).toBe(5);
  });
});

describe("pickToImport", () => {
  const ids = Array.from({ length: 80 }, (_, i) => `a${i}`);
  test("free plan caps at the latest 50", () => {
    expect(pickToImport(ids, new Set(), "free")).toEqual(ids.slice(0, 50));
  });
  test("paid plan takes everything", () => {
    expect(pickToImport(ids, new Set(), "paid")).toHaveLength(80);
  });
  test("skips known ids, and known ids still count against the window", () => {
    expect(pickToImport(ids, new Set(["a0", "a1"]), "free")).toEqual(ids.slice(2, 50));
  });
});

describe("manifest fixture", () => {
  test("every playful category in the manifest is a valid room", () => {
    for (const image of manifest.images) {
      expect(Object.keys(PLAYFUL_KEYS)).toContain(image.category);
    }
  });
});

describe("extraction fixes", () => {
  test("a phone status bar clock is never returned as a date", () => {
    const r = parseExtraction(
      JSON.stringify({
        ...base,
        dates: [
          { when: "9:41", what: "Phone status bar time", confident: false },
          { when: "09:41", what: "clock", confident: true },
          { when: "2026-11-16T18:30", what: "event", confident: true },
          { when: "11:20", what: "Flight arrival time", confident: false },
          { when: "2026-11-16", what: "Battery 80%", confident: true },
        ],
      }),
    );
    expect(r.dates).toEqual([{ when: "2026-11-16T18:30", what: "event", confident: true }]);
  });
  test("partial month-day dates stay, not confident", () => {
    const r = parseExtraction(
      JSON.stringify({ ...base, dates: [{ when: "11-21T08:30", what: "hike", confident: true }] }),
    );
    expect(r.dates).toEqual([{ when: "11-21T08:30", what: "hike", confident: false }]);
  });
  test("reactionKey is picked from a stable hash of the screenshot id and varies", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const raw = JSON.stringify({ ...base, reactionKey: "deadlines_01" });
      const a = parseExtraction(raw, `id${i}`, LONG_AGO).reactionKey;
      expect(parseExtraction(raw, `id${i}`, LONG_AGO).reactionKey).toBe(a);
      expect(PLAYFUL_KEYS.deadlines).toContain(a);
      keys.add(a);
    }
    expect(keys.size).toBeGreaterThan(4);
  });
  test("chats are capped at importance 2", () => {
    const r = parseExtraction(JSON.stringify({ ...base, category: "chats", importance: 4, reactionKey: "chats_02" }));
    expect(r.importance).toBe(2);
  });
});


describe("titles and amounts", () => {
  const title = (t: string) => parseExtraction(JSON.stringify({ ...base, title: t })).title;
  test("the exact bad bill title is cleaned", () => {
    expect(title("Brightside Power & Light: $142.37 due")).toBe("Brightside Power & Light");
  });
  test("no price, date or trailing due, five words at most", () => {
    expect(title("Brightside Power bill, $142.37")).toBe("Brightside Power bill");
    expect(title("Dental cleaning Nov 19, 2026 at 9:15")).toBe("Dental cleaning");
    expect(title("Harvest Lantern Night 2026-11-16")).toBe("Harvest Lantern Night");
    expect(title("Rent payment due")).toBe("Rent payment");
    expect(title("One two three four five six seven")).toBe("One two three four five");
  });
  test("an empty cleaned title falls back", () => {
    expect(title("$142.37 due")).toBe("Untitled screenshot");
  });
  test("amount is kept only when it appears in the screenshot text", () => {
    const withText = (amount: string) =>
      parseExtraction(JSON.stringify({ ...base, text: "Amount due $142.37 by Nov 16", amount })).amount;
    expect(withText("$142.37")).toBe("$142.37");
    expect(withText("$99.00")).toBe("");
    expect(withText("about 142")).toBe("");
  });
});


describe("serious lines", () => {
  const NOW = Date.UTC(2026, 10, 15, 20, 0);
  const keyFor = (over: object) => parseExtraction(JSON.stringify({ ...base, ...over }), "shot1", NOW).reactionKey;
  test("importance 4 or 5 with a confident date within 14 days gets the room's serious key", () => {
    expect(SERIOUS_KEYS.deadlines).toContain(keyFor({}));
    expect(SERIOUS_KEYS.money).toContain(
      keyFor({ category: "money", importance: 5, dates: [{ when: "2026-11-16", what: "due", confident: true }] }),
    );
  });
  test("a date more than 14 days away, an unsure date, or low importance stays playful", () => {
    expect(PLAYFUL_KEYS.deadlines).toContain(keyFor({ dates: [{ when: "2026-12-30", what: "x", confident: true }] }));
    expect(PLAYFUL_KEYS.deadlines).toContain(keyFor({ dates: [{ when: "11-21", what: "x", confident: false }] }));
    expect(PLAYFUL_KEYS.deadlines).toContain(keyFor({ importance: 3 }));
  });
  test("unsorted has no serious keys", () => {
    expect(PLAYFUL_KEYS.unsorted).toContain(keyFor({ category: "unsorted" }));
  });
});

describe("todos from a screenshot", () => {
  const todos = (v: unknown) => parseExtraction(JSON.stringify({ ...base, todos: v })).todos;
  test("trims, de-duplicates, caps at two and drops junk", () => {
    expect(todos(["  Pay the Brightside Power bill ", "pay the brightside power bill", "Reply to Maya", "Third one"])).toEqual([
      "Pay the Brightside Power bill",
      "Reply to Maya",
    ]);
    expect(todos(["", "   ", 5, null, "x".repeat(90)])).toEqual([]);
  });
  test("a bad or missing value is an empty list", () => {
    expect(todos("pay")).toEqual([]);
    expect(todos(undefined)).toEqual([]);
    expect(parseExtraction(JSON.stringify(base)).todos).toEqual([]);
  });
});
