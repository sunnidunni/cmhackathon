import type { KeeperId } from "@/design/psst";
import { dateLabel, ROOM_KEEPER } from "./model";

export type TodoItem = { _id: string; text: string; done: boolean; screenshotId: string | null; createdAt: number };
export type ShotInfo = { category: string; date: string | null };
export type TodoRow = { id: string; text: string; done: boolean; screenshotId: string | null; keeper: KeeperId; due: string | null; late: boolean };

const bare = (when: string) => dateLabel(when).replace(/^\w{3}, /, "");

// A to-do borrows its room and date from the screenshot it came from. Without one it gets Mote and no date.
// Screenshots already on Today's handful or focus are left out, so one task never shows twice.
// Open rows run by date, soonest first, with undated ones last. A date before today reads "Was Nov 12", in plain ink.
export function buildTodoRows(todos: TodoItem[], shots: ReadonlyMap<string, ShotInfo>, day: string | undefined, shown: ReadonlySet<string>): { open: TodoRow[]; done: TodoRow[] } {
  const entries = todos
    .filter((t) => !t.screenshotId || !shown.has(t.screenshotId))
    .map((t) => {
      const shot = t.screenshotId ? shots.get(t.screenshotId) : undefined;
      const when = shot?.date ?? null;
      const late = when !== null && day !== undefined && when.slice(0, 10) < day;
      const row: TodoRow = {
        id: t._id,
        text: t.text,
        done: t.done,
        screenshotId: t.screenshotId,
        keeper: ROOM_KEEPER[shot?.category ?? ""] ?? "mote",
        due: when === null ? null : late ? `Was ${bare(when.slice(0, 10))}` : bare(when),
        late,
      };
      return { row, when };
    });
  const byDate = (x: { when: string | null }, y: { when: string | null }) => (x.when === null ? 1 : 0) - (y.when === null ? 1 : 0) || (x.when ?? "").localeCompare(y.when ?? "");
  return { open: entries.filter((x) => !x.row.done).sort(byDate).map((x) => x.row), done: entries.filter((x) => x.row.done).map((x) => x.row) };
}

export const OPEN_LIMIT = 5;
export const DONE_LIMIT = 3;

// Five open to-dos and the latest few done ones; expanding shows everything.
export function visibleTodos(open: TodoRow[], done: TodoRow[], expanded: boolean) {
  if (expanded) return { open, done, hidden: 0 };
  return { open: open.slice(0, OPEN_LIMIT), done: done.slice(0, DONE_LIMIT), hidden: Math.max(0, open.length - OPEN_LIMIT) + Math.max(0, done.length - DONE_LIMIT) };
}

export const showAllLabel = (open: number, done: number) => `Show all (${open + done})`;
