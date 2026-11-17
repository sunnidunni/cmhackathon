import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { addMemory, removeDocuments, removeNamespace } from "./lib/memoryClient";

// A failed delete is tried again after each of these waits, then given up on and logged.
// Deleting is a promise to the user, so one bad network moment must not leave their text in memory.
export const FORGET_RETRY_MS = [60_000, 10 * 60_000, 60 * 60_000, 6 * 60 * 60_000];

const failed = (what: string, e: unknown, attempt: number) =>
  console.error(`Supermemory ${what} failed (attempt ${attempt + 1} of ${FORGET_RETRY_MS.length + 1})`, e instanceof Error ? e.message : String(e));

// Removes documents from the user's namespace (the bare Convex user id): a screenshot's reading, or chat turns. Never throws.
export const forgetDocs = internalAction({
  args: { userId: v.id("users"), docIds: v.array(v.string()), attempt: v.optional(v.number()) },
  handler: async (ctx, { userId, docIds, attempt = 0 }) => {
    try {
      await removeDocuments(userId, docIds);
    } catch (e) {
      failed("forget", e, attempt);
      const wait = FORGET_RETRY_MS[attempt];
      if (wait !== undefined) await ctx.scheduler.runAfter(wait, internal.memory.forgetDocs, { userId, docIds, attempt: attempt + 1 });
    }
  },
});

// Removes the user's whole namespace, for "Delete everything". Never throws.
export const forgetAll = internalAction({
  args: { userId: v.id("users"), attempt: v.optional(v.number()) },
  handler: async (ctx, { userId, attempt = 0 }) => {
    try {
      await removeNamespace(userId);
    } catch (e) {
      failed("forget all", e, attempt);
      const wait = FORGET_RETRY_MS[attempt];
      if (wait !== undefined) await ctx.scheduler.runAfter(wait, internal.memory.forgetAll, { userId, attempt: attempt + 1 });
    }
  },
});

// Stores what we read in the user's namespace, the same one the chat turns use.
// Never throws: the screenshot is already ready, and a memory failure must not change that.
export const store = internalAction({
  args: {
    screenshotId: v.id("screenshots"),
    userId: v.id("users"),
    title: v.string(),
    summary: v.string(),
    text: v.string(),
    category: v.string(),
    dates: v.array(v.object({ when: v.string(), what: v.string(), confident: v.boolean() })),
  },
  handler: async (ctx, args) => {
    try {
      const dates = args.dates.map((d) => `${d.what}: ${d.when}${d.confident ? "" : " (not certain)"}`);
      await addMemory(args.userId, {
        id: args.screenshotId,
        content: [
          `Screenshot: ${args.title}`,
          `Room: ${args.category}`,
          `Summary: ${args.summary}`,
          dates.length > 0 ? `Dates: ${dates.join("; ")}` : "",
          `Text: ${args.text}`,
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: { screenshotId: args.screenshotId, kind: "screenshot", category: args.category },
      });
      const stillThere = await ctx.runMutation(internal.extract.markMemoryStored, { screenshotId: args.screenshotId });
      // The screenshot was removed while this was storing it: take the reading back out.
      if (!stillThere) await ctx.scheduler.runAfter(0, internal.memory.forgetDocs, { userId: args.userId, docIds: [args.screenshotId] });
    } catch (e) {
      console.error("Supermemory store failed", e instanceof Error ? e.message : String(e));
    }
  },
});
