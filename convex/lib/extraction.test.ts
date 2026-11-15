import { describe, expect, test } from "vitest";
import { parseExtraction } from "./extraction";
import { pickToImport } from "./importPlan";
import { PLAYFUL_KEYS } from "./lines";
import manifest from "../../src/content/manifest.json";

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
      const a = parseExtraction(raw, `id${i}`).reactionKey;
      expect(parseExtraction(raw, `id${i}`).reactionKey).toBe(a);
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

