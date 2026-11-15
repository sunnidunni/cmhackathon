import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const screenshotStatus = v.union(
  v.literal("uploaded"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("failed"),
);

export const category = v.union(
  v.literal("deadlines"),
  v.literal("chats"),
  v.literal("money"),
  v.literal("ideas"),
  v.literal("unsorted"),
);

export default defineSchema({
  ...authTables,

  // Replaces the Convex Auth users table: keeps its fields and indexes, adds ours.
  // An anonymous user has isAnonymous: true; upgrading links a real account to the same row.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    plan: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    pushToken: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  screenshots: defineTable({
    userId: v.id("users"),
    deviceAssetId: v.string(),
    storageId: v.id("_storage"),
    takenAt: v.number(),
    status: screenshotStatus,
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    summary: v.optional(v.string()),
    category: v.optional(category),
    reason: v.optional(v.string()),
    dates: v.optional(
      v.array(
        v.object({
          when: v.string(),
          what: v.string(),
          confident: v.boolean(),
        }),
      ),
    ),
    importance: v.optional(v.number()),
    reactionKey: v.optional(v.string()),
    userMoved: v.optional(v.boolean()),
    hidden: v.optional(v.boolean()),
  })
    .index("by_user_category", ["userId", "category"])
    .index("by_user_deviceAssetId", ["userId", "deviceAssetId"])
    .index("by_user_importance", ["userId", "importance"])
    .index("by_user_takenAt", ["userId", "takenAt"]),

  reminders: defineTable({
    userId: v.id("users"),
    screenshotId: v.id("screenshots"),
    dueAt: v.number(),
    message: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("dismissed"),
    ),
  })
    .index("by_user_dueAt", ["userId", "dueAt"])
    .index("by_screenshot", ["screenshotId"]),

  questions: defineTable({
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
    sourceScreenshotIds: v.array(v.id("screenshots")),
    createdAt: v.number(),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
});
