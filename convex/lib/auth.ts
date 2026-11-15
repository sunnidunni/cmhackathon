import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "../_generated/server";

export async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  return userId;
}
