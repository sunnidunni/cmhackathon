import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { EXTRACTION_SCHEMA, buildPrompt, parseExtraction } from "./lib/extraction";
import { requireUserId } from "./lib/auth";

export const MAX_PARALLEL = 10;
export const MAX_ATTEMPTS = 3;
const STALE_MS = 3 * 60 * 1000;
const backoffMs = (attempts: number) => 5000 * 2 ** (attempts - 1);

// Starts extraction for waiting screenshots, at most MAX_PARALLEL at a time across the deployment.
// Oldest creation first, which is the newest photo first because import creates rows newest first.
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
    const waiting = await ctx.db
      .query("screenshots")
      .withIndex("by_status", (q) => q.eq("status", "uploaded"))
      .take(200);
    const due = waiting.filter((r) => (r.retryAt ?? 0) <= now);
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
    return { userId: row.userId, url: await ctx.storage.getUrl(row.storageId) };
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
    dates: v.array(v.object({ when: v.string(), what: v.string(), confident: v.boolean() })),
    importance: v.number(),
    reactionKey: v.string(),
  },
  handler: async (ctx, { screenshotId, ...result }) => {
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.status !== "processing") return false;
    await ctx.db.patch(screenshotId, {
      ...result,
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
    if (rateLimited) {
      const wait = 8000 + Math.floor(Math.random() * 4000);
      await ctx.db.patch(screenshotId, { status: "uploaded", error, retryAt: Date.now() + wait });
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
  handler: async (ctx, { screenshotId }) => {
    await ctx.db.patch(screenshotId, { memoryStored: true });
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
      await ctx.db.patch(row._id, { status: "uploaded", attempts: 0, retryAt: undefined, error: undefined });
    await ctx.scheduler.runAfter(0, internal.extract.kick, {});
    return null;
  },
});

async function callVision(imageUrl: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-6.1-terra",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: buildPrompt(today) },
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ],
      text: {
        format: { type: "json_schema", name: "screenshot", strict: true, schema: EXTRACTION_SCHEMA },
      },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text: string | undefined =
    body.output_text ??
    body.output
      ?.flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
      .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI returned no text");
  return text;
}

export const run = internalAction({
  args: { screenshotId: v.id("screenshots") },
  handler: async (ctx, { screenshotId }) => {
    try {
      const target = await ctx.runQuery(internal.extract.getForExtract, { screenshotId });
      if (target === null) return;
      if (target.url === null) throw new Error("Image missing from storage");
      const result = parseExtraction(await callVision(target.url), screenshotId);
      const saved = await ctx.runMutation(internal.extract.complete, { screenshotId, ...result });
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
        rateLimited: /^OpenAI 429/.test(error),
      });
    } finally {
      await ctx.runMutation(internal.extract.kick, {});
    }
  },
});
