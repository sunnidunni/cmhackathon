import { describe, expect, test } from "vitest";
import { chunk, findUnknown, limitKey, planUploads, scanSize, UNCAPPED_SCAN } from "./sync-plan";

describe("planUploads", () => {
  test("uploads only unknown ids, newest first", () => {
    expect(planUploads(["n3", "n2", "n1"], ["n1", "n3"], null)).toEqual(["n3", "n1"]);
  });
  test("skips everything the server already knows", () => {
    expect(planUploads(["a", "b"], [], null)).toEqual([]);
  });
  test("the cap applies to the newest library assets, not to the unknown ones", () => {
    expect(planUploads(["a", "b", "c", "d"], ["b", "d"], 2)).toEqual(["b"]);
  });
  test("a zero cap uploads nothing", () => {
    expect(planUploads(["a"], ["a"], 0)).toEqual([]);
  });
  test("duplicate ids upload once", () => {
    expect(planUploads(["a", "a", "b"], ["a", "b"], null)).toEqual(["a", "b"]);
  });
});

describe("plan limits (DER-19)", () => {
  const library = Array.from({ length: 80 }, (_, i) => `a${i}`);
  test("a free user (limit 50) stops at the newest 50", () => {
    expect(scanSize(50)).toBe(50);
    expect(planUploads(library.slice(0, scanSize(50)), library, 50)).toEqual(library.slice(0, 50));
  });
  test("a paid user (limit null) imports past 50", () => {
    expect(scanSize(null)).toBeGreaterThan(library.length);
    expect(planUploads(library.slice(0, scanSize(null)), library, null)).toHaveLength(80);
  });
});

test("scanSize uses the cap or the ceiling", () => {
  expect(scanSize(50)).toBe(50);
  expect(scanSize(null)).toBe(UNCAPPED_SCAN);
});

test("chunk splits evenly with a short tail", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
});

describe("findUnknown", () => {
  const ids = Array.from({ length: 10 }, (_, i) => `a${i}`);
  // A fake server that does not know the ids listed in `missing`, and records what it was asked.
  const server = (missing: string[]) => {
    const asked: string[][] = [];
    const ask = async (chunk: string[]) => {
      asked.push(chunk);
      return chunk.filter((id) => missing.includes(id));
    };
    return { ask, asked };
  };

  test("a quick walk stops at the first chunk with nothing new", async () => {
    const { ask, asked } = server(["a1"]);
    expect(await findUnknown(ids, ask, true, 3)).toEqual(["a1"]);
    // Chunk one had a1; chunk two had nothing new, so chunks three and four were never asked about.
    expect(asked).toEqual([["a0", "a1", "a2"], ["a3", "a4", "a5"]]);
  });

  test("a quick walk with nothing new at all asks once", async () => {
    const { ask, asked } = server([]);
    expect(await findUnknown(ids, ask, true, 3)).toEqual([]);
    expect(asked).toHaveLength(1);
  });

  test("a quick walk keeps going while every chunk has something new, so a fresh library is walked to the end", async () => {
    const { ask, asked } = server(ids);
    expect(await findUnknown(ids, ask, true, 3)).toEqual(ids);
    expect(asked).toHaveLength(4);
  });

  test("a full walk asks about every chunk, and finds an old gap a quick walk would stop before", async () => {
    const { ask, asked } = server(["a9"]);
    expect(await findUnknown(ids, ask, false, 3)).toEqual(["a9"]);
    expect(asked).toHaveLength(4);
    const quick = server(["a9"]);
    expect(await findUnknown(ids, quick.ask, true, 3)).toEqual([]);
  });

  test("the stored limit tells a free plan from an unlimited one", () => {
    expect(limitKey(50)).toBe("50");
    expect(limitKey(null)).toBe("all");
  });
});
