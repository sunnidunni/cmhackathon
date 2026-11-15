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
