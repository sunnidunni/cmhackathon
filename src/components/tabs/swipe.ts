export const TAB_ORDER = ["today", "rooms", "ask", "you"] as const;
export type TabName = (typeof TAB_ORDER)[number];

const DISTANCE = 70;
const VELOCITY = 600;

// Swipe left goes to the next tab, swipe right to the previous one. Short, slow drags do nothing.
export function tabAfterSwipe(current: string, dx: number, vx: number): TabName | null {
  "worklet";
  const i = TAB_ORDER.indexOf(current as TabName);
  if (i < 0) return null;
  if (Math.abs(dx) < DISTANCE && Math.abs(vx) < VELOCITY) return null;
  const next = dx < 0 ? i + 1 : i - 1;
  return next >= 0 && next < TAB_ORDER.length ? TAB_ORDER[next] : null;
}
