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

// A Whop payment succeeded. The payment is recorded so a later refund can find its user,
// and so a payment that was already refunded can never upgrade anyone again.
export const markPaid = internalMutation({
  args: { userId: v.string(), whopPaymentId: v.string() },
  handler: async (ctx, { userId, whopPaymentId }) => {
    const id = ctx.db.normalizeId("users", userId);
    if (id === null) return "unknown_user" as const;
    const user = await ctx.db.get(id);
    if (user === null) return "unknown_user" as const;
    const known = await ctx.db
      .query("payments")
      .withIndex("by_whopPaymentId", (q) => q.eq("whopPaymentId", whopPaymentId))
      .first();
    if (known?.refundedAt !== undefined) return "refunded" as const;
    if (known === null) await ctx.db.insert("payments", { userId: id, whopPaymentId, paidAt: Date.now() });
    if (user.plan === "paid") return "already_paid" as const;
    await ctx.db.patch(id, { plan: "paid" });
    return "paid" as const;
  },
});

// A Whop payment was refunded. The user goes back to free unless another payment of theirs still stands.
export const markRefunded = internalMutation({
  args: { whopPaymentId: v.string() },
  handler: async (ctx, { whopPaymentId }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_whopPaymentId", (q) => q.eq("whopPaymentId", whopPaymentId))
      .first();
    // The payment's own event has not arrived yet (Whop does not promise an order). Remember the refund,
    // so that payment upgrades nobody when it does.
    if (payment === null) {
      await ctx.db.insert("payments", { whopPaymentId, refundedAt: Date.now() });
      return "refund_recorded" as const;
    }
    if (payment.refundedAt !== undefined) return "already_refunded" as const;
    await ctx.db.patch(payment._id, { refundedAt: Date.now() });
    const userId = payment.userId;
    if (userId === undefined) return "refund_recorded" as const;
    const others = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (others.some((p) => p._id !== payment._id && p.refundedAt === undefined)) return "still_paid" as const;
    await ctx.db.patch(userId, { plan: "free" });
    return "refunded" as const;
  },
});
