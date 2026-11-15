import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

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
      if (existing === null) unknown.push(deviceAssetId);
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
      if (existing.storageId !== storageId) {
        const mine = await ctx.db
          .query("screenshots")
          .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
          .collect();
        if (!mine.some((row) => row.storageId === storageId)) await ctx.storage.delete(storageId);
      }
      return existing._id;
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
