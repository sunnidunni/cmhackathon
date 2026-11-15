import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { nextConfidentDate, type Date_ } from "./handful";

export type ReminderState = {
  id: Id<"reminders">;
  state: "scheduled" | "sent" | "dismissed";
  dueAt: number;
} | null;

export function reminderFor(reminders: Doc<"reminders">[], screenshotId: Id<"screenshots">, when: string | null): ReminderState {
  const mine = reminders
    .filter((r) => r.screenshotId === screenshotId && r.status !== "dismissed" && (when === null || r.whenKey === when))
    .sort((a, b) => b._creationTime - a._creationTime)[0];
  return mine ? { id: mine._id, state: mine.status as "scheduled" | "sent", dueAt: mine.dueAt } : null;
}

export type Section = "justIn" | "missed" | "handful" | "thin";

export async function toCard(
  ctx: QueryCtx,
  row: Doc<"screenshots">,
  reminders: Doc<"reminders">[],
  section: Section,
  now: number,
  tz: number,
) {
  const date: Date_ | null = nextConfidentDate(row, now, tz);
  const reminder = reminderFor(reminders, row._id, date?.when ?? null);
  let actions: { primary: "remind" | "done" | "keep" | "see"; secondary: "done" | "detail" | "delete" };
  if (section === "missed") actions = { primary: "see", secondary: "done" };
  else if (section === "thin") actions = { primary: "keep", secondary: "delete" };
  else if (date && reminder) actions = { primary: "done", secondary: "detail" };
  else if (date) actions = { primary: "remind", secondary: "done" };
  else actions = { primary: "keep", secondary: "delete" };
  return {
    _id: row._id,
    title: row.title ?? "",
    category: row.category ?? "unsorted",
    lineKey: row.reactionKey ?? null,
    imageUrl: await ctx.storage.getUrl(row.storageId),
    importance: row.importance ?? 1,
    takenAt: row.takenAt,
    date,
    reminder,
    actions,
  };
}
