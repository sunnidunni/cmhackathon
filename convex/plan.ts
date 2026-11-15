import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const myPlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user === null ? null : (user.plan ?? "free");
  },
});

export const currentUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    return { userId, plan: user?.plan ?? "free" };
  },
});

export const markPaid = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const id = ctx.db.normalizeId("users", userId);
    if (id === null) return "unknown_user" as const;
    const user = await ctx.db.get(id);
    if (user === null) return "unknown_user" as const;
    if (user.plan === "paid") return "already_paid" as const;
    await ctx.db.patch(id, { plan: "paid" });
    return "paid" as const;
  },
});
