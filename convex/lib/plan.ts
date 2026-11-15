import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// The one place that reads the plan. The Whop thread can swap the body for its own plan query.
export async function getPlan(ctx: QueryCtx, userId: Id<"users">): Promise<"free" | "paid"> {
  const user = await ctx.db.get(userId);
  return user?.plan === "paid" ? "paid" : "free";
}
