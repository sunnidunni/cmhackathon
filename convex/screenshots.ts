import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { countImport, importsUnlimited } from "./lib/importPlan";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// True when the person removed this screenshot from Shots. It must not be imported again.
async function wasRemoved(ctx: QueryCtx, userId: Id<"users">, deviceAssetId: string) {
  const row = await ctx.db
    .query("removedAssets")
    .withIndex("by_user_deviceAssetId", (q) => q.eq("userId", userId).eq("deviceAssetId", deviceAssetId))
    .first();
  return row !== null;
}

// Deletes an upload that no screenshot uses. The id comes from the client, so check that nobody's
// screenshot points at it first: otherwise a caller could delete a file by naming it.
async function discardUpload(ctx: MutationCtx, storageId: Id<"_storage">) {
  const used = await ctx.db
    .query("screenshots")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .first();
  if (used === null) await ctx.storage.delete(storageId).catch(() => undefined);
}

// The ids the phone should upload: not already in Shots, and not removed from it by the person.
export const unknownDeviceAssetIds = query({
  args: { deviceAssetIds: v.array(v.string()) },
  handler: async (ctx, { deviceAssetIds }) => {
    const userId = await requireUserId(ctx);
    const unknown: string[] = [];
    for (const deviceAssetId of deviceAssetIds) {
      const existing = await ctx.db
        .query("screenshots")
        .withIndex("by_user_deviceAssetId", (q) =>
          q.eq("userId", userId).eq("deviceAssetId", deviceAssetId),
        )
        .first();
      if (existing === null && !(await wasRemoved(ctx, userId, deviceAssetId))) unknown.push(deviceAssetId);
    }
    return unknown;
  },
});

export const create = mutation({
  args: {
    deviceAssetId: v.string(),
    storageId: v.id("_storage"),
    takenAt: v.number(),
  },
  handler: async (ctx, { deviceAssetId, storageId, takenAt }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("screenshots")
      .withIndex("by_user_deviceAssetId", (q) =>
        q.eq("userId", userId).eq("deviceAssetId", deviceAssetId),
      )
      .first();
    if (existing !== null) {
      if (existing.storageId !== storageId) await discardUpload(ctx, storageId);
      return existing._id;
    }
    // Removed by the person: drop the upload and create nothing. null tells the caller it was not imported.
    if (await wasRemoved(ctx, userId, deviceAssetId)) {
      await discardUpload(ctx, storageId);
      return null;
    }
    // Over today's free allowance: same answer as above, nothing is imported.
    const user = await ctx.db.get(userId);
    if (!importsUnlimited(user?.plan === "paid" ? "paid" : "free")) {
      const { allowed, ...counter } = countImport(user ?? {}, Date.now());
      await ctx.db.patch(userId, counter);
      if (!allowed) {
        await discardUpload(ctx, storageId);
        return null;
      }
    }
    const id = await ctx.db.insert("screenshots", {
      userId,
      deviceAssetId,
      storageId,
      takenAt,
      status: "uploaded",
    });
    await ctx.scheduler.runAfter(0, internal.extract.kick, {});
    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: await ctx.storage.getUrl(row.storageId),
      })),
    );
  },
});
