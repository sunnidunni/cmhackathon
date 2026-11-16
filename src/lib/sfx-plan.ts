export const SFX_NAMES = ["tock-filed", "murmur-filed", "penny-filed", "mote-filed", "boop", "pop", "confirm", "sent", "celebrate"] as const;
export type SfxName = (typeof SFX_NAMES)[number];
export type SfxKeeper = "tock" | "murmur" | "penny" | "mote";
export type SfxReaction = "tap" | "filed" | "celebrate" | "reveal";

export const SOUNDS_DEFAULT = true;
export const MIN_GAP_MS = 300;

export const parseSounds = (stored: string | null): boolean => (stored === null ? SOUNDS_DEFAULT : stored !== "0");

// Never more than one sound per 300 ms: a second sound that close to the last one is dropped, not queued.
export const allowSound = (lastAt: number, now: number): boolean => now - lastAt >= MIN_GAP_MS;

export function sfxForReaction(keeper: SfxKeeper, reaction: SfxReaction): SfxName {
  if (reaction === "filed") return `${keeper}-filed`;
  if (reaction === "tap") return "boop";
  if (reaction === "reveal") return "pop";
  return "celebrate";
}
