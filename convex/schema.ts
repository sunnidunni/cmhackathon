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
    lastOpenedAt: v.optional(v.number()),
    // The phone's time zone name, such as "America/Los_Angeles", from the last time the app opened.
    timeZone: v.optional(v.string()),
    // Imports counted against the free plan's daily allowance: when the current day's count began, and the count.
    importWindowStart: v.optional(v.number()),
    importCount: v.optional(v.number()),
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
    // Only on screenshots read before the text moved to screenshotTexts. See lib/shotText.ts.
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
    attempts: v.optional(v.number()),
    // How many times OpenAI has said "slow down" for this screenshot since it was last started fresh.
    rateLimits: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    retryAt: v.optional(v.number()),
    error: v.optional(v.string()),
    memoryStored: v.optional(v.boolean()),
    amount: v.optional(v.string()),
    todosExtracted: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    doneAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_status_todosExtracted", ["status", "todosExtracted"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_category_takenAt", ["userId", "category", "takenAt"])
    .index("by_user_deviceAssetId", ["userId", "deviceAssetId"])
    .index("by_user_importance", ["userId", "importance"])
    .index("by_user_takenAt", ["userId", "takenAt"])
    .index("by_storageId", ["storageId"]),

  // Everything readable in a screenshot, one row per screenshot. Kept apart from screenshots so that listing
  // screenshots does not read their full text. See lib/shotText.ts.
  screenshotTexts: defineTable({
    screenshotId: v.id("screenshots"),
    userId: v.id("users"),
    text: v.string(),
  }).index("by_screenshot", ["screenshotId"]),

  // Screenshots the person removed from Shots. The photo is still on the phone, so without this row
  // the next sync would see it as new and import it again. "Delete everything" clears these too.
  removedAssets: defineTable({
    userId: v.id("users"),
    deviceAssetId: v.string(),
    removedAt: v.number(),
  }).index("by_user_deviceAssetId", ["userId", "deviceAssetId"]),

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
    whenKey: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    scheduledId: v.optional(v.id("_scheduled_functions")),
  })
    .index("by_user_dueAt", ["userId", "dueAt"])
    .index("by_user_status_dueAt", ["userId", "status", "dueAt"])
    .index("by_screenshot", ["screenshotId"]),

  todos: defineTable({
    userId: v.id("users"),
    text: v.string(),
    done: v.boolean(),
    screenshotId: v.optional(v.id("screenshots")),
    createdAt: v.number(),
  })
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_screenshot", ["screenshotId"]),

  dailyPicks: defineTable({
    userId: v.id("users"),
    day: v.string(),
    ids: v.array(v.id("screenshots")),
    thin: v.boolean(),
  }).index("by_user_day", ["userId", "day"]),

  // One row per Whop payment that upgraded a user, so a refund can find the user it belongs to.
  // Whop does not promise the order its events arrive in. A refund that arrives before its payment is kept as a
  // row with refundedAt and no userId or paidAt, so the payment cannot upgrade anyone when it does arrive.
  payments: defineTable({
    userId: v.optional(v.id("users")),
    whopPaymentId: v.string(),
    paidAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
  })
    .index("by_whopPaymentId", ["whopPaymentId"])
    .index("by_user", ["userId"]),

  siriKeys: defineTable({
    keyHash: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_keyHash", ["keyHash"])
    .index("by_user", ["userId"]),

  albums: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
    sortStatus: v.union(v.literal("sorting"), v.literal("done"), v.literal("failed")),
    sortRun: v.number(),
  }).index("by_user_createdAt", ["userId", "createdAt"]),

  // One row per screenshot in an album. removed: true is a tombstone for a manual removal, so auto-sort never re-adds it.
  albumShots: defineTable({
    userId: v.id("users"),
    albumId: v.id("albums"),
    screenshotId: v.id("screenshots"),
    source: v.union(v.literal("auto"), v.literal("manual")),
    removed: v.boolean(),
    addedAt: v.number(),
  })
    .index("by_album_screenshot", ["albumId", "screenshotId"])
    .index("by_screenshot", ["screenshotId"]),

  questions: defineTable({
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
    sourceScreenshotIds: v.array(v.id("screenshots")),
    found: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
});
