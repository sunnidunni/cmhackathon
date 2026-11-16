import type { Item } from "./model";

// What the Today tab remembers for the day: the focus it chose, and the items the person sent away with "Not today".
export type FocusMemory = { day: string; id: string; skipped: string[] };

// The focus stays the same all day while it is still in the handful and not handled, done or skipped.
// A new day, or a focus that has left the handful, picks again. Skipped ids belong to one day and clear with it.
export function chooseFocus(items: Item[], memory: FocusMemory | null, day: string): { focus: Item | undefined; next: FocusMemory | null } {
  const same = memory?.day === day ? memory : null;
  const pinned = same ? items.find((i) => i.id === same.id && !i.handled) : undefined;
  const focus = pinned ?? items.find((i) => !i.handled && i.section !== "thin") ?? items.find((i) => !i.handled);
  return { focus, next: focus ? { day, id: focus.id, skipped: same?.skipped ?? [] } : memory };
}

export const skippedToday = (memory: FocusMemory | null | undefined, day: string): string[] => (memory?.day === day ? memory.skipped : []);

export function withSkipped(memory: FocusMemory | null | undefined, day: string, id: string): FocusMemory {
  const same = memory?.day === day ? memory : null;
  return { day, id: same?.id ?? "", skipped: [...new Set([...(same?.skipped ?? []), id])] };
}

export const sameMemory = (a: FocusMemory | null, b: FocusMemory | null | undefined) =>
  a?.day === b?.day && a?.id === b?.id && a?.skipped.length === b?.skipped.length;
