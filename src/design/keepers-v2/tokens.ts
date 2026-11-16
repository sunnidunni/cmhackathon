// Keeper motion tokens. Builds on src/design/motion.ts (duration, easing, spring, stagger, blink); only keeper-specific values live here.
import type { KeeperName } from "./keeperArt";

export const keeperMotion = {
  feetY: 216 / 240, // feet sit on y 216 of the 240 canvas: every scale and rotate pivots there
  tap: { duration: 600, rotate: 4 }, // wiggle: 0 → -4° → 4° → -2° → 0
  hop: { height: 0.06, up: 160, down: 260 }, // fraction of size
  squish: { x: 1.07, y: 0.92, in: 140, out: 320 },
  jingle: { rotate: 3, step: 90, count: 4 },
  float: { height: 0.035, up: 420, down: 520 },
  celebrate: { hops: 2 },
  reveal: { from: 0.6, smileAt: 450 },
  holding: { lift: 0.04, duration: 300 },
  breathe: { scaleY: 1.025, half: 2000 },
  idleBob: { height: 0.012, half: 2200 }, // Mote's float, the only always-on idle besides blinks
  queueGap: 240, // stagger.reaction: only one keeper reacts at a time, starts ≥240 ms apart
} as const;

/** The filed reaction is each keeper's signature: Tock hops, Murmur squishes, Penny jingles, Mote floats. */
export const filedReaction: Record<KeeperName, "hop" | "squish" | "jingle" | "float"> = {
  tock: "hop",
  murmur: "squish",
  penny: "jingle",
  mote: "float",
};

/** Penny's signature is her clasp-knob eyes, so she double-blinks more often. */
export const doubleBlinkChance: Record<KeeperName, number> = { tock: 1 / 7, murmur: 1 / 7, penny: 1 / 3, mote: 1 / 7 };

/** Tap lines: calm, short, no exclamation marks, no secrecy promises. */
export const tapLines: Record<KeeperName, readonly string[]> = {
  tock: ["There's time. I checked.", "I'll ring first."],
  murmur: ["The plan, kept warm.", "Got the address right here."],
  penny: ["Every cent has a home.", "Receipts, all in a row."],
  mote: ["Every idea gets a someday.", "Kept that one for you."],
};
