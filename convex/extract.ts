import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { EXTRACTION_SCHEMA, albumKey, buildPrompt, parseExtraction } from "./lib/extraction";
import type { AlbumBrief } from "./lib/albumModel";
import { requireUserId } from "./lib/auth";
import { isRateLimit, respond, visionModel } from "./lib/openai";
import { fairOrder } from "./lib/queue";
import { writeText } from "./lib/shotText";
import { dayInZone } from "./lib/time";
import { insertTodos } from "./todos";
import { sortIntoAlbums } from "./albums";

export const MAX_PARALLEL = 10;
export const MAX_ATTEMPTS = 3;
// How many "slow down" replies one screenshot may get before it is marked failed. At 8 to 12 seconds apart
// that is about five minutes of OpenAI being busy; the person can then retry it.
export const MAX_RATE_LIMITS = 30;
// How far back and forward kick looks in the waiting line.
const OLDEST_WINDOW = 200;
const NEWEST_WINDOW = 50;
const STALE_MS = 3 * 60 * 1000;
const backoffMs = (attempts: number) => 5000 * 2 ** (attempts - 1);

// Starts extraction for waiting screenshots, at most MAX_PARALLEL at a time across the deployment.
// Each user's own screenshots go oldest creation first, which is the newest photo first because import creates
// rows newest first. Between users the slots are shared out in turns (see fairOrder).
export const kick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const processing = await ctx.db
      .query("screenshots")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .take(100);
    let active = 0;
    for (const row of processing) {
      if ((row.startedAt ?? 0) > now - STALE_MS) {
        active++;
        continue;
      }
      const attempts = (row.attempts ?? 0) + 1;
      await ctx.db.patch(
        row._id,
        attempts >= MAX_ATTEMPTS
          ? { status: "failed", attempts, error: "Timed out" }
          : { status: "uploaded", attempts, retryAt: now + backoffMs(attempts) },
      );
    }
    const oldest = await ctx.db
      .query("screenshots")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .take(OLDEST_WINDOW);
    // A long line from one user can fill the whole oldest window. The newest rows are looked at too,
    // so someone who has just brought in a few screenshots is seen and gets a turn.
    const newest =
      oldest.length < OLDEST_WINDOW
        ? []
        : await ctx.db
            .query("screenshots")
            .withIndex("by_status", (q) => q.eq("status", "uploaded"))
            .order("desc")
            .take(NEWEST_WINDOW);
    const seen = new Set(oldest.map((r) => r._id));
    const waiting = [...oldest, ...newest.reverse().filter((r) => !seen.has(r._id))];
    const due = fairOrder(waiting.filter((r) => (r.retryAt ?? 0) <= now));
    for (const row of due.slice(0, Math.max(0, MAX_PARALLEL - active))) {
      await ctx.db.patch(row._id, { status: "processing", startedAt: now });
      await ctx.scheduler.runAfter(0, internal.extract.run, { screenshotId: row._id });
      // If the action is killed by a timeout, this kick reclaims the row.
      await ctx.scheduler.runAfter(STALE_MS + 1000, internal.extract.kick, {});
    }
    const later = waiting.filter((r) => (r.retryAt ?? 0) > now);
    if (later.length > 0) {
      const next = Math.min(...later.map((r) => r.retryAt ?? now));
      await ctx.scheduler.runAfter(Math.max(0, next - now) + 100, internal.extract.kick, {});
    }
  },
});

export const getForExtract = internalQuery({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, { screenshotId }) => {
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.status !== "processing") return null;
    const albums = await ctx.db
      .query("albums")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", row.userId))
      .collect();
    const user = await ctx.db.get(row.userId);
    return {
      userId: row.userId,
      takenAt: row.takenAt,
      timeZone: user?.timeZone ?? null,
      url: await ctx.storage.getUrl(row.storageId),
      albums: albums.map((a) => ({ _id: a._id, run: a.sortRun, name: a.name, description: a.description })),
    };
  },
});

export const complete = internalMutation({
  args: {
    screenshotId: v.id("screenshots"),
    title: v.string(),
    amount: v.optional(v.string()),
    text: v.string(),
    summary: v.string(),
    category: v.union(
      v.literal("deadlines"),
      v.literal("chats"),
      v.literal("money"),
      v.literal("ideas"),
      v.literal("unsorted"),
    ),
    reason: v.string(),
    todos: v.optional(v.array(v.string())),
    albums: v.optional(v.object({ seen: v.array(v.object({ albumId: v.id("albums"), run: v.number() })), matched: v.array(v.id("albums")) })),
    dates: v.array(v.object({ when: v.string(), what: v.string(), confident: v.boolean() })),
    importance: v.number(),
    reactionKey: v.string(),
  },
  handler: async (ctx, { screenshotId, todos, albums, text, ...result }) => {
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.status !== "processing") return false;
    await writeText(ctx, row, text);
    if (row.todosExtracted !== true) await insertTodos(ctx, row.userId, screenshotId, todos ?? []);
    await sortIntoAlbums(ctx, row.userId, screenshotId, albums ?? { seen: [], matched: [] });
    await ctx.db.patch(screenshotId, {
      ...result,
      // The text was stored beside the screenshot just above, not on it.
      text: undefined,
      todosExtracted: true,
      // The user's own move wins over the model's category.
      ...(row.userMoved ? { category: row.category } : {}),
      status: "ready",
      readAt: Date.now(),
      error: undefined,
    });
    return true;
  },
});

export const fail = internalMutation({
  args: { screenshotId: v.id("screenshots"), error: v.string(), rateLimited: v.optional(v.boolean()) },
  handler: async (ctx, { screenshotId, error, rateLimited }) => {
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.status !== "processing") return;
    // "Slow down" is not the screenshot's fault, so it waits and tries again without using up an attempt.
    // It still has its own limit: without one, a screenshot would go round forever if OpenAI never recovered.
    if (rateLimited) {
      const rateLimits = (row.rateLimits ?? 0) + 1;
      if (rateLimits >= MAX_RATE_LIMITS) {
        await ctx.db.patch(screenshotId, { status: "failed", rateLimits, error });
        return;
      }
      const wait = 8000 + Math.floor(Math.random() * 4000);
      await ctx.db.patch(screenshotId, { status: "uploaded", rateLimits, error, retryAt: Date.now() + wait });
      await ctx.scheduler.runAfter(wait + 100, internal.extract.kick, {});
      return;
    }
    const attempts = (row.attempts ?? 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await ctx.db.patch(screenshotId, { status: "failed", attempts, error });
      return;
    }
    await ctx.db.patch(screenshotId, {
      status: "uploaded",
      attempts,
      error,
      retryAt: Date.now() + backoffMs(attempts),
    });
    await ctx.scheduler.runAfter(backoffMs(attempts) + 100, internal.extract.kick, {});
  },
});

export const markMemoryStored = internalMutation({
  args: { screenshotId: v.id("screenshots") },
  // Returns false when the screenshot was deleted in the meantime.
  handler: async (ctx, { screenshotId }) => {
    if ((await ctx.db.get(screenshotId)) === null) return false;
    await ctx.db.patch(screenshotId, { memoryStored: true });
    return true;
  },
});

// User taps "try again" on a failed screenshot.
export const retry = mutation({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, { screenshotId }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.userId !== userId || row.status !== "failed") return;
    await ctx.db.patch(screenshotId, {
      status: "uploaded",
      attempts: 0,
      rateLimits: 0,
      retryAt: undefined,
      error: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.extract.kick, {});
  },
});

// "Try again" on every failed screenshot.
export const retryAllFailed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const failed = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    for (const row of failed.filter((r) => r.status === "failed"))
      await ctx.db.patch(row._id, { status: "uploaded", attempts: 0, rateLimits: 0, retryAt: undefined, error: undefined });
    await ctx.scheduler.runAfter(0, internal.extract.kick, {});
    return null;
  },
});

// zone is the person's time zone: "today" and the day the screenshot was taken are their calendar days, not the server's.
async function callVision(imageUrl: string, albums: AlbumBrief[], takenAt: number, zone: string) {
  return respond({
    model: visionModel(),
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: buildPrompt(dayInZone(Date.now(), zone), albums, dayInZone(takenAt, zone)) },
          { type: "input_image", image_url: imageUrl, detail: "auto" },
        ],
      },
    ],
    schemaName: "screenshot",
    schema: EXTRACTION_SCHEMA,
  });
}

export const run = internalAction({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, { screenshotId }) => {
    try {
      const target = await ctx.runQuery(internal.extract.getForExtract, { screenshotId });
      if (target === null) return;
      if (target.url === null) throw new Error("Image missing from storage");
      const { albums, ...result } = parseExtraction(
        await callVision(target.url, target.albums, target.takenAt, target.timeZone ?? "UTC"),
        screenshotId,
        Date.now(),
        target.albums.map((_, i) => albumKey(i)),
      );
      const saved = await ctx.runMutation(internal.extract.complete, {
        screenshotId,
        ...result,
        albums: {
          seen: target.albums.map((a) => ({ albumId: a._id, run: a.run })),
          matched: target.albums.filter((_, i) => albums.includes(albumKey(i))).map((a) => a._id),
        },
      });
      if (saved) {
        await ctx.runAction(internal.memory.store, {
          screenshotId,
          userId: target.userId,
          title: result.title,
          summary: result.summary,
          text: result.text,
          category: result.category,
          dates: result.dates,
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await ctx.runMutation(internal.extract.fail, {
        screenshotId,
        error,
        rateLimited: isRateLimit(error),
      });
    } finally {
      await ctx.runMutation(internal.extract.kick, {});
    }
  },
});
