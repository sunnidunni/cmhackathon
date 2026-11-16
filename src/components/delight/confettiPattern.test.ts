import { describe, expect, it } from "vitest";
import { CONFETTI_COUNT, confettiFor, confettiPieces } from "./confettiPattern";

describe("confettiFor", () => {
  it("gives Tock, Murmur and Mote their own shapes", () => {
    expect(confettiFor("tock")).toBe("tick");
    expect(confettiFor("murmur")).toBe("bubble");
    expect(confettiFor("mote")).toBe("sparkle");
  });
  it("never gives Penny confetti", () => {
    expect(confettiFor("penny")).toBeNull();
  });
  it("skips things that were due today", () => {
    expect(confettiFor("tock", { dueToday: true })).toBeNull();
  });
});

describe("confettiPieces", () => {
  it("fans fourteen pieces upward, 60 to 110 pt out", () => {
    for (const rand of [() => 0, () => 0.999]) {
      const pieces = confettiPieces(rand);
      expect(pieces).toHaveLength(CONFETTI_COUNT);
      for (const p of pieces) {
        expect(Math.sin(p.angle)).toBeLessThan(0);
        expect(p.distance).toBeGreaterThanOrEqual(60);
        expect(p.distance).toBeLessThanOrEqual(110);
      }
    }
  });
});
