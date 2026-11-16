import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { category } from "./schema";
import { requireUserId } from "./lib/auth";
import { reminderFor } from "./lib/cards";
import { isUrgent, pickLineKey } from "./lib/extraction";
import { deleteAlbumsFor, forgetShot } from "./albums";

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

const markDone = async (ctx: MutationCtx, id: Id<"screenshots">) => {
  await mine(ctx, id);
  await ctx.db.patch(id, { doneAt: Date.now() });
  return null;
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

async function deleteRow(ctx: MutationCtx, row: Doc<"screenshots">) {
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
}

export const remove = mutation({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    const row = await mine(ctx, id);
    await deleteRow(ctx, row);
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", row.userId))
      .collect();
    for (const todo of todos.filter((x) => x.screenshotId === id)) await ctx.db.patch(todo._id, { screenshotId: undefined });
    await ctx.scheduler.runAfter(0, internal.memory.forget, { userId: row.userId, screenshotId: id });
    return null;
  },
});

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    for (const row of rows) await deleteRow(ctx, row);
    for (const q of await ctx.db.query("questions").withIndex("by_user_createdAt", (x) => x.eq("userId", userId)).collect())
      await ctx.db.delete(q._id);
    for (const todo of await ctx.db.query("todos").withIndex("by_user_createdAt", (x) => x.eq("userId", userId)).collect())
      await ctx.db.delete(todo._id);
    await deleteAlbumsFor(ctx, userId);
    for (const p of await ctx.db.query("dailyPicks").withIndex("by_user_day", (x) => x.eq("userId", userId)).collect())
      await ctx.db.delete(p._id);
    await ctx.scheduler.runAfter(0, internal.memory.forget, { userId });
    return null;
  },
});
