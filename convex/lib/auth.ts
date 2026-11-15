import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";

export async function requireUserId(ctx: { auth: Auth }) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  return userId;
}
