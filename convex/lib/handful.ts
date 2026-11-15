import type { Doc } from "../_generated/dataModel";
import { isFutureWhen, parseWhen } from "./time";

export const ROOM_ORDER = ["deadlines", "chats", "money", "ideas", "unsorted"] as const;

export type Date_ = { when: string; what: string; confident: boolean };

export function nextConfidentDate(row: Doc<"screenshots">, now: number, tz: number): Date_ | null {
  const future = (row.dates ?? []).filter((d) => d.confident && isFutureWhen(d.when, now, tz));
  future.sort((a, b) => (parseWhen(a.when, tz)?.instant ?? 0) - (parseWhen(b.when, tz)?.instant ?? 0));
  return future[0] ?? null;
}

// Picks today's handful: at most 3, one per room, soonest confident future date first, then importance.
// When nothing qualifies, one quiet Ideas or Money item (importance 1 to 2, oldest saved first).
export function computePick(rows: Doc<"screenshots">[], now: number, tz: number) {
  const open = rows.filter((r) => r.status === "ready" && r.hidden !== true && r.doneAt === undefined);
  const dated = (r: Doc<"screenshots">) => {
    const d = nextConfidentDate(r, now, tz);
    return d ? (parseWhen(d.when, tz)?.instant ?? Infinity) : null;
  };
  const candidates = open
    .filter((r) => (r.importance ?? 1) >= 4)
    .sort((a, b) => {
      const da = dated(a);
      const db = dated(b);
      if (da !== null && db !== null) return da - db;
      if (da !== null) return -1;
      if (db !== null) return 1;
      return (b.importance ?? 1) - (a.importance ?? 1) || b.takenAt - a.takenAt;
    });
  const seen = new Set<string>();
  const ids = [];
  for (const r of candidates) {
    const room = r.category ?? "unsorted";
    if (seen.has(room)) continue;
    seen.add(room);
    ids.push(r._id);
    if (ids.length === 3) break;
  }
  if (ids.length > 0) return { ids, thin: false };
  const quiet = open
    .filter((r) => (r.category === "ideas" || r.category === "money") && (r.importance ?? 1) <= 2)
    .sort((a, b) => a.takenAt - b.takenAt)[0];
  return quiet ? { ids: [quiet._id], thin: true } : { ids: [], thin: false };
}
