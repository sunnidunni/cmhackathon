import { describe, expect, test } from "vitest";
import { chunk, planUploads, scanSize, UNCAPPED_SCAN } from "./sync-plan";

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

test("scanSize uses the cap or the ceiling", () => {
  expect(scanSize(50)).toBe(50);
  expect(scanSize(null)).toBe(UNCAPPED_SCAN);
});

test("chunk splits evenly with a short tail", () => {
  expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
});
