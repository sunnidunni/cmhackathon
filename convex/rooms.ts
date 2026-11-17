import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { category } from "./schema";
import { requireUserId } from "./lib/auth";
import { ROOM_ORDER } from "./lib/handful";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const ready = rows.filter((r) => r.status === "ready" && r.hidden !== true);
    return await Promise.all(
      ROOM_ORDER.map(async (room) => {
        const mine = ready.filter((r) => (r.category ?? "unsorted") === room);
        const newest = mine[0];
        return {
          category: room,
          count: mine.length,
          newest: newest
            ? {
                _id: newest._id,
                title: newest.title ?? "",
                lineKey: newest.reactionKey ?? null,
                imageUrl: await ctx.storage.getUrl(newest.storageId),
              }
            : null,
        };
      }),
    );
  },
});

export const all = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const mine = rows.filter((r) => r.status === "ready" && r.hidden !== true);
    return {
      count: mine.length,
      items: await Promise.all(
        mine.map(async (r) => ({
          _id: r._id,
          title: r.title ?? "",
          date: (r.dates ?? []).find((d) => d.confident)?.when ?? null,
          imageUrl: await ctx.storage.getUrl(r.storageId),
          lineKey: r.reactionKey ?? null,
          takenAt: r.takenAt,
          category: r.category ?? "unsorted",
        })),
      ),
    };
  },
});

const shape = async (ctx: QueryCtx, r: Doc<"screenshots">) => ({
  _id: r._id,
  title: r.title ?? "",
  date: (r.dates ?? []).find((d) => d.confident)?.when ?? null,
  imageUrl: await ctx.storage.getUrl(r.storageId),
  lineKey: r.reactionKey ?? null,
  takenAt: r.takenAt,
  category: r.category ?? ("unsorted" as const),
});

// The newest ready screenshots, newest first, at most `limit` (and never more than 100).
// For the places that only need what is recent: "recently filed", "new today", and spotting things to act on.
export const recent = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const userId = await requireUserId(ctx);
    const want = Math.max(0, Math.min(100, Math.floor(limit)));
    // Screenshots still being read sit among the newest, so look a little past the limit to find enough ready ones.
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(want * 3);
    const ready = rows.filter((r) => r.status === "ready" && r.hidden !== true).slice(0, want);
    return await Promise.all(ready.map((r) => shape(ctx, r)));
  },
});

// One page of ready screenshots, newest first: the whole library, or one room when `category` is given.
// The grids load page by page as the person scrolls, so a large library is never sent to the phone in one piece.
export const page = query({
  args: { paginationOpts: paginationOptsValidator, category: v.optional(category) },
  handler: async (ctx, { paginationOpts, category: room }) => {
    const userId = await requireUserId(ctx);
    const rows = room
      ? ctx.db.query("screenshots").withIndex("by_user_category_takenAt", (q) => q.eq("userId", userId).eq("category", room))
      : ctx.db.query("screenshots").withIndex("by_user_takenAt", (q) => q.eq("userId", userId));
    const result = await rows
      .order("desc")
      .filter((q) => q.and(q.eq(q.field("status"), "ready"), q.neq(q.field("hidden"), true)))
      .paginate(paginationOpts);
    return { ...result, page: await Promise.all(result.page.map((r) => shape(ctx, r))) };
  },
});
