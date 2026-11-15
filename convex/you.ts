import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { ROOM_ORDER } from "./lib/handful";
import { headlineFor } from "./lib/headline";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    const ready = rows.filter((r) => r.status === "ready" && r.hidden !== true);
    const counts = ROOM_ORDER.map((category) => ({
      category,
      count: ready.filter((r) => (r.category ?? "unsorted") === category).length,
    }));
    return { total: ready.length, counts, headline: headlineFor(counts, ready.length) };
  },
});
