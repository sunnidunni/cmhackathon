import { describe, expect, it } from "vitest";
import { keepersDue, screenshotsIn, stampLabel } from "./model";

describe("keepersDue", () => {
  it("pops Tock at 1, Penny at 4, Murmur at 8, Mote at 12", () => {
    expect([0, 1, 3, 4, 7, 8, 11, 12].map((n) => keepersDue(n, false))).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });
  it("shows all four once done, even for a small import", () => {
    expect(keepersDue(2, true)).toBe(4);
  });
});

describe("labels", () => {
  it("pluralises screenshot", () => {
    expect(screenshotsIn(1)).toBe("1 screenshot");
    expect(screenshotsIn(16)).toBe("16 screenshots");
  });
  it("builds the stamp from the real count and date", () => {
    expect(stampLabel(16, new Date(2026, 10, 15))).toBe("MADE NOV 15 · 16 SCREENSHOTS");
  });
});
