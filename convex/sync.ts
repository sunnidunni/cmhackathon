import { query } from "./_generated/server";
import { FREE_IMPORT_LIMIT } from "./lib/importPlan";
import { requireUserId } from "./lib/auth";
import { getPlan } from "./lib/plan";

// How many of the newest library screenshots this user may import. null means no cap.
export const importInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const plan = await getPlan(ctx, userId);
    return { plan, limit: plan === "paid" ? null : FREE_IMPORT_LIMIT };
  },
});

// Live count for "12 of 50 read". total is every screenshot not yet hidden; read is the ones with a result.
export const progress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    const visible = rows.filter((r) => r.hidden !== true);
    const count = (status: string) => visible.filter((r) => r.status === status).length;
    return {
      total: visible.length,
      read: count("ready"),
      failed: count("failed"),
      pending: count("uploaded") + count("processing"),
    };
  },
});
