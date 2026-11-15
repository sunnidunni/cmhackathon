import type { KeeperId } from "@/design/psst";
import { dateLabel, ROOM_KEEPER } from "./model";

export type TodoItem = { _id: string; text: string; done: boolean; screenshotId: string | null; createdAt: number };
export type ShotInfo = { category: string; date: string | null };
export type TodoRow = { id: string; text: string; done: boolean; screenshotId: string | null; keeper: KeeperId; due: string | null };

// A to-do borrows its room and due date from the screenshot it came from. Without one it gets Mote and no date.
export function buildTodoRows(todos: TodoItem[], shots: ReadonlyMap<string, ShotInfo>): { open: TodoRow[]; done: TodoRow[] } {
  const rows = todos.map((t): TodoRow => {
    const shot = t.screenshotId ? shots.get(t.screenshotId) : undefined;
    return { id: t._id, text: t.text, done: t.done, screenshotId: t.screenshotId, keeper: ROOM_KEEPER[shot?.category ?? ""] ?? "mote", due: shot?.date ? `Due ${dateLabel(shot.date)}` : null };
  });
  return { open: rows.filter((r) => !r.done), done: rows.filter((r) => r.done) };
}

export const OPEN_LIMIT = 5;
export const DONE_LIMIT = 3;

// Five open to-dos and the latest few done ones; expanding shows everything.
export function visibleTodos(open: TodoRow[], done: TodoRow[], expanded: boolean) {
  if (expanded) return { open, done, hidden: 0 };
  return { open: open.slice(0, OPEN_LIMIT), done: done.slice(0, DONE_LIMIT), hidden: Math.max(0, open.length - OPEN_LIMIT) + Math.max(0, done.length - DONE_LIMIT) };
}

export const showAllLabel = (open: number, done: number) => `Show all (${open + done})`;
