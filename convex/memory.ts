import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { addMemory, removeMemory } from "./lib/memoryClient";

// Stores what we read in the user's namespace (the bare Convex user id), the same one the
// chat turns use. Never throws: the screenshot is already ready, and a memory failure must not change that.
// Removes one screenshot's memory, or the whole namespace when no screenshot is given. Never throws.
export const forget = internalAction({
  args: { userId: v.id("users"), screenshotId: v.optional(v.id("screenshots")) },
  handler: async (_ctx, { userId, screenshotId }) => {
    try {
      await removeMemory(userId, screenshotId);
    } catch (e) {
      console.error("Supermemory forget failed", e instanceof Error ? e.message : String(e));
    }
  },
});

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
      await ctx.runMutation(internal.extract.markMemoryStored, { screenshotId: args.screenshotId });
    } catch (e) {
      console.error("Supermemory store failed", e instanceof Error ? e.message : String(e));
    }
  },
});
