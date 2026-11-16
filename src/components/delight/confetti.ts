import type { KeeperId } from "@/design/psst";

export const CONFETTI_COUNT = 14;
export type PieceShape = "tick" | "bubble" | "sparkle";
export type Piece = { angle: number; distance: number; spin: number; shade: 0 | 1 | 2; size: number };

// Pieces are drawn in the keeper's own shapes: Tock's dial ticks, Murmur's reply bubbles, Mote's sparkles.
// Penny never gets confetti: money is never rewarded.
export const CONFETTI_SHAPE: Partial<Record<KeeperId, PieceShape>> = { tock: "tick", murmur: "bubble", mote: "sparkle" };

// Confetti is for a Done or a set reminder, but not for money, and not for something that was due today (relief, not a party).
export function confettiFor(keeper: KeeperId, opts: { dueToday?: boolean } = {}): PieceShape | null {
  if (opts.dueToday) return null;
  return CONFETTI_SHAPE[keeper] ?? null;
}

// Fourteen pieces fanned from -30 to -150 degrees (up), 60 to 110 pt out, each with its own spin and colour. `rand` is injectable for tests.
export function confettiPieces(rand: () => number = Math.random): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    angle: ((-30 - (120 * (i + rand() * 0.8)) / CONFETTI_COUNT) * Math.PI) / 180,
    distance: 60 + rand() * 50,
    spin: (rand() * 2 - 1) * 180,
    shade: (i % 3) as 0 | 1 | 2,
    size: 9 + Math.round(rand() * 4),
  }));
}
