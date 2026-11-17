import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";

// Writes automatic to-dos for a screenshot; skips text already on that screenshot.
export async function insertTodos(ctx: MutationCtx, userId: Id<"users">, screenshotId: Id<"screenshots">, texts: string[]) {
  if (texts.length === 0) return;
  const existing = await ctx.db
    .query("todos")
    .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
    .collect();
  const have = new Set(existing.filter((t) => t.screenshotId === screenshotId).map((t) => t.text.toLowerCase()));
  for (const text of texts) {
    if (have.has(text.toLowerCase())) continue;
    await ctx.db.insert("todos", { userId, text, done: false, screenshotId, createdAt: Date.now() });
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("todos")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    // shot: the room and date a to-do borrows from its screenshot, so the app does not need the whole library to show it.
    const shape = async (r: (typeof rows)[number]) => {
      const from = r.screenshotId ? await ctx.db.get(r.screenshotId) : null;
      return {
        _id: r._id,
        text: r.text,
        done: r.done,
        screenshotId: r.screenshotId ?? null,
        createdAt: r.createdAt,
        shot: from ? { category: from.category ?? ("unsorted" as const), date: (from.dates ?? []).find((d) => d.confident)?.when ?? null } : null,
      };
    };
    return await Promise.all([...rows.filter((r) => !r.done), ...rows.filter((r) => r.done)].map(shape));
  },
});

export const add = mutation({
  args: { text: v.string(), screenshotId: v.optional(v.id("screenshots")) },
  handler: async (ctx, { text, screenshotId }) => {
    const userId = await requireUserId(ctx);
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 200) throw new Error("A to-do needs 1 to 200 characters");
    if (screenshotId) {
      const shot = await ctx.db.get(screenshotId);
      if (shot === null || shot.userId !== userId) throw new Error("Screenshot not found");
    }
    return await ctx.db.insert("todos", { userId, text: trimmed, done: false, screenshotId, createdAt: Date.now() });
  },
});

async function mine(ctx: MutationCtx, id: Id<"todos">) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (row === null || row.userId !== userId) throw new Error("To-do not found");
  return row;
}

export const toggle = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, { id }) => {
    const row = await mine(ctx, id);
    await ctx.db.patch(id, { done: !row.done });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, { id }) => {
    await mine(ctx, id);
    await ctx.db.delete(id);
    return null;
  },
});
