import { describe, expect, test } from "vitest";
import { clampOffset, clampScale, nextTapScale } from "./zoom";

describe("zoom helpers", () => {
  test("scale stays between 1 and 5", () => {
    expect(clampScale(0.4)).toBe(1);
    expect(clampScale(2.2)).toBe(2.2);
    expect(clampScale(9)).toBe(5);
  });

  test("no panning at scale 1, edges held when zoomed", () => {
    expect(clampOffset(80, 1, 400)).toBe(0);
    expect(clampOffset(500, 2, 400)).toBe(200);
    expect(clampOffset(-500, 2, 400)).toBe(-200);
    expect(clampOffset(50, 2, 400)).toBe(50);
  });

  test("double tap zooms in, then back out", () => {
    expect(nextTapScale(1)).toBe(2.5);
    expect(nextTapScale(2.5)).toBe(1);
    expect(nextTapScale(1.02)).toBe(2.5);
  });
});
