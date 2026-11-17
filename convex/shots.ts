import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { category } from "./schema";
import { requireUserId } from "./lib/auth";
import { reminderFor } from "./lib/cards";
import { isUrgent, pickLineKey } from "./lib/extraction";
import { deleteAlbumsBefore, forgetShot } from "./albums";
import { chatDocIds } from "./lib/memoryDocs";
import { dismissActive } from "./reminders";

async function mine(ctx: MutationCtx, id: Id<"screenshots">) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (row === null || row.userId !== userId) throw new Error("Screenshot not found");
  return row;
}

export const detail = query({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) return null;
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_screenshot", (q) => q.eq("screenshotId", id))
      .collect();
    return {
      _id: row._id,
      status: row.status,
      title: row.title ?? "",
      summary: row.summary ?? "",
      reason: row.reason ?? "",
      amount: row.amount ?? null,
      category: row.category ?? "unsorted",
      userMoved: row.userMoved === true,
      lineKey: row.reactionKey ?? null,
      imageUrl: await ctx.storage.getUrl(row.storageId),
      importance: row.importance ?? 1,
      takenAt: row.takenAt,
      error: row.error ?? null,
      dates: (row.dates ?? []).map((d) => ({
        ...d,
        reminder: d.confident ? reminderFor(reminders, id, d.when) : null,
      })),
    };
  },
});

export const markOpened = mutation({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    await mine(ctx, id);
    await ctx.db.patch(id, { openedAt: Date.now() });
    return null;
  },
});

// Marking a screenshot done also ends its reminders, so nothing buzzes about a thing already handled.
// dismissedReminderIds lets the phone cancel the matching local notifications.
const markDone = async (ctx: MutationCtx, id: Id<"screenshots">) => {
  await mine(ctx, id);
  await ctx.db.patch(id, { doneAt: Date.now() });
  return { dismissedReminderIds: await dismissActive(ctx, id) };
};
export const done = mutation({ args: { id: v.id("screenshots") }, handler: (ctx, { id }) => markDone(ctx, id) });
export const keep = mutation({ args: { id: v.id("screenshots") }, handler: (ctx, { id }) => markDone(ctx, id) });

export const move = mutation({
  args: { id: v.id("screenshots"), category },
  handler: async (ctx, { id, category: room }) => {
    const row = await mine(ctx, id);
    await ctx.db.patch(id, {
      category: room,
      userMoved: true,
      reactionKey: pickLineKey(room, id, isUrgent(row.importance ?? 1, row.dates ?? [], Date.now())),
    });
    return null;
  },
});

// Deletes a screenshot with its reminders, album entries and file. Returns the reminder ids it deleted.
async function deleteRow(ctx: MutationCtx, row: Doc<"screenshots">): Promise<Id<"reminders">[]> {
  const reminders = await ctx.db
    .query("reminders")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", row._id))
    .collect();
  for (const r of reminders) {
    if (r.scheduledId) await ctx.scheduler.cancel(r.scheduledId).catch(() => undefined);
    await ctx.db.delete(r._id);
  }
  await forgetShot(ctx, row._id);
  await ctx.storage.delete(row.storageId).catch(() => undefined);
  await ctx.db.delete(row._id);
  return reminders.map((r) => r._id);
}

// Removing one screenshot takes it out of Rooms, Ask and reminders, and keeps it out:
// - its device asset id is remembered, so the next sync does not import the same photo again;
// - answers that used it as a source go too, from Ask's history and from memory, because they quote it.
// Its to-dos stay (the person may still want to do them) but no longer point at it.
export const remove = mutation({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    const row = await mine(ctx, id);
    const dismissedReminderIds = await deleteRow(ctx, row);
    const known = await ctx.db
      .query("removedAssets")
      .withIndex("by_user_deviceAssetId", (q) => q.eq("userId", row.userId).eq("deviceAssetId", row.deviceAssetId))
      .first();
    if (known === null) await ctx.db.insert("removedAssets", { userId: row.userId, deviceAssetId: row.deviceAssetId, removedAt: Date.now() });
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", row.userId))
      .collect();
    for (const todo of todos.filter((x) => x.screenshotId === id)) await ctx.db.patch(todo._id, { screenshotId: undefined });
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", row.userId))
      .collect();
    const quoting = questions.filter((q) => q.sourceScreenshotIds.includes(id));
    for (const q of quoting) await ctx.db.delete(q._id);
    await ctx.scheduler.runAfter(0, internal.memory.forgetDocs, {
      userId: row.userId,
      docIds: [id, ...quoting.flatMap((q) => chatDocIds(q._id))],
    });
    return { dismissedReminderIds };
  },
});

// How many rows one pass of "delete everything" removes. A large library is far more than one mutation may
// read and write, so the delete runs as a chain of passes.
export const DELETE_BATCH = 200;

// One pass. Deletes up to DELETE_BATCH of the user's rows created at or before `before`. done is true when none are left.
// Rows created after `before` stay, so a library the person starts again while an old one is still being deleted survives.
async function deleteSome(ctx: MutationCtx, userId: Id<"users">, before: number): Promise<{ done: boolean; shotIds: Id<"screenshots">[] }> {
  const shotIds = await deleteSomeShots(ctx, userId, before);
  if (shotIds.length === DELETE_BATCH) return { done: false, shotIds };
  return { done: await deleteSomeOthers(ctx, userId, before, DELETE_BATCH - shotIds.length), shotIds };
}

async function deleteSomeShots(ctx: MutationCtx, userId: Id<"users">, before: number) {
  const shots = await ctx.db
    .query("screenshots")
    .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
    .filter((q) => q.lte(q.field("_creationTime"), before))
    .take(DELETE_BATCH);
  for (const row of shots) await deleteRow(ctx, row);
  return shots.map((row) => row._id);
}

// Everything that is not a screenshot, once the screenshots are gone. True when none of it is left.
async function deleteSomeOthers(ctx: MutationCtx, userId: Id<"users">, before: number, left: number): Promise<boolean> {
  left -= await deleteAlbumsBefore(ctx, userId, before, left);
  if (left <= 0) return false;

  for (const table of ["questions", "todos"] as const) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .filter((q) => q.lte(q.field("_creationTime"), before))
      .take(left);
    for (const r of rows) await ctx.db.delete(r._id);
    left -= rows.length;
    if (left <= 0) return false;
  }

  const picks = await ctx.db
    .query("dailyPicks")
    .withIndex("by_user_day", (q) => q.eq("userId", userId))
    .filter((q) => q.lte(q.field("_creationTime"), before))
    .take(left);
  for (const p of picks) await ctx.db.delete(p._id);
  left -= picks.length;
  if (left <= 0) return false;

  const removed = await ctx.db
    .query("removedAssets")
    .withIndex("by_user_deviceAssetId", (q) => q.eq("userId", userId))
    .filter((q) => q.lte(q.field("_creationTime"), before))
    .take(left);
  for (const r of removed) await ctx.db.delete(r._id);
  return removed.length < left;
}

async function deleteAndContinue(ctx: MutationCtx, userId: Id<"users">, before: number) {
  const { done, shotIds } = await deleteSome(ctx, userId, before);
  if (!done) await ctx.scheduler.runAfter(0, internal.shots.removeAllRest, { userId, before });
  return shotIds;
}

// "Delete everything": every screenshot, reminder, answer, to-do and album, and the user's memory.
// The first pass runs here, so a failure reaches the person; the rest follow by themselves.
// The user row stays, so a paid plan is not lost.
export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await ctx.scheduler.runAfter(0, internal.memory.forgetAll, { userId });
    // A row's creation time carries fractions of a millisecond and Date.now() does not, so a row created
    // just before this call can read as slightly later than "now". The extra millisecond covers that.
    await deleteAndContinue(ctx, userId, Date.now() + 1);
    return null;
  },
});

export const removeAllRest = internalMutation({
  args: { userId: v.id("users"), before: v.number() },
  handler: async (ctx, { userId, before }) => {
    const shotIds = await deleteAndContinue(ctx, userId, before);
    // The memory was wiped when the delete began. A screenshot still waiting its turn may have been read and stored
    // since then, so forget this pass's screenshots again.
    if (shotIds.length > 0) await ctx.scheduler.runAfter(0, internal.memory.forgetDocs, { userId, docIds: shotIds });
  },
});
