import type { Item } from "./model";

// The focus the Today tab chose, with the local day it chose it on.
export type FocusMemory = { day: string; id: string };

// The focus stays the same all day while it is still in the handful and not handled, done or skipped.
// A new day, or a focus that has left the handful, picks again.
export function chooseFocus(items: Item[], memory: FocusMemory | null, day: string): { focus: Item | undefined; next: FocusMemory | null } {
  const pinned = memory?.day === day ? items.find((i) => i.id === memory.id && !i.handled) : undefined;
  const focus = pinned ?? items.find((i) => !i.handled && i.section !== "thin") ?? items.find((i) => !i.handled);
  return { focus, next: focus ? { day, id: focus.id } : memory };
}

export const sameMemory = (a: FocusMemory | null, b: FocusMemory | null) => a?.day === b?.day && a?.id === b?.id;
