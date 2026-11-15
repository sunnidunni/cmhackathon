import type { KeeperId } from "@/design/psst";

export const REVEAL_ORDER: KeeperId[] = ["tock", "penny", "murmur", "mote"];
const POP_AT: Record<KeeperId, number> = { tock: 1, penny: 4, murmur: 8, mote: 12 };

export const ROOM_FOR: Record<KeeperId, "deadlines" | "chats" | "money" | "ideas"> = {
  tock: "deadlines",
  murmur: "chats",
  penny: "money",
  mote: "ideas",
};

export const ROOM_LABEL: Record<KeeperId, string> = { tock: "Deadlines", murmur: "Chats", penny: "Money", mote: "Ideas" };

export const REACTION_GAP_MS = 260;

// How many keepers should be on screen: Tock at 1 read, Penny Pocket at 4, Murmur at 8, Mote at 12. All four once the import is done.
export function keepersDue(read: number, done: boolean): number {
  if (done) return REVEAL_ORDER.length;
  return REVEAL_ORDER.filter((id) => read >= POP_AT[id]).length;
}

export function screenshotsIn(n: number): string {
  return n === 1 ? "1 screenshot" : `${n} screenshots`;
}

export function stampLabel(total: number, now: Date): string {
  const day = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  return `MADE ${day} · ${screenshotsIn(total).toUpperCase()}`;
}
