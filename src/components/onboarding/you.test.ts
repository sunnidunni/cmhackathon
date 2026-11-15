import { describe, expect, it } from "vitest";
import { barSegments, countsLine, fromLine } from "./you";

const counts = [
  { category: "deadlines", count: 6 },
  { category: "chats", count: 22 },
  { category: "money", count: 0 },
  { category: "ideas", count: 4 },
  { category: "unsorted", count: 8 },
];

describe("you card", () => {
  it("sizes bar segments by share and skips empty rooms", () => {
    const segs = barSegments(counts);
    expect(segs.map((s) => s.category)).toEqual(["deadlines", "chats", "ideas", "unsorted"]);
    expect(segs.reduce((n, s) => n + s.fraction, 0)).toBeCloseTo(1);
    expect(segs[1].fraction).toBeCloseTo(22 / 40);
  });
  it("has no segments for an empty library", () => {
    expect(barSegments(counts.map((c) => ({ ...c, count: 0 })))).toEqual([]);
  });
  it("lists counts largest first with room names", () => {
    expect(countsLine(counts)).toBe("Chats 22 · Unsorted 8 · Deadlines 6 · Ideas 4");
  });
  it("words the source line", () => {
    expect(fromLine(1)).toBe("From your 1 screenshot");
    expect(fromLine(40)).toBe("From your 40 screenshots");
  });
});
