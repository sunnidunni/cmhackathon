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

const PAGE_FRACTION = 1 / 3;
const FLICK = 500;

// Where a dragged pager settles: the neighbour once the drag passes a third of the screen or the
// finger flicks fast, otherwise back to the current page. Never past the first or last page.
export function pageAfterDrag(index: number, dx: number, vx: number, width: number, count: number): number {
  const commit = Math.abs(dx) > width * PAGE_FRACTION || Math.abs(vx) > FLICK;
  if (!commit) return index;
  const dir = Math.abs(vx) > FLICK ? -Math.sign(vx) : -Math.sign(dx);
  return Math.min(count - 1, Math.max(0, index + dir));
}
