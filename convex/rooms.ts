import { v } from "convex/values";
import { query } from "./_generated/server";
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

export const get = query({
  args: { category },
  handler: async (ctx, { category: room }) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_category", (q) => q.eq("userId", userId).eq("category", room))
      .collect();
    const mine = rows
      .filter((r) => r.status === "ready" && r.hidden !== true)
      .sort((a, b) => b.takenAt - a.takenAt);
    return {
      category: room,
      count: mine.length,
      newestLineKey: mine[0]?.reactionKey ?? null,
      items: await Promise.all(
        mine.map(async (r) => ({
          _id: r._id,
          title: r.title ?? "",
          date: (r.dates ?? []).find((d) => d.confident)?.when ?? null,
          imageUrl: await ctx.storage.getUrl(r.storageId),
          lineKey: r.reactionKey ?? null,
          takenAt: r.takenAt,
        })),
      ),
    };
  },
});
