import { v } from "convex/values";
import { Supermemory } from "supermemory";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Stores what we read in the user's own Supermemory namespace. Never throws: the screenshot is
// already ready, and a memory failure must not change that.
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
      const client = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });
      const dates = args.dates.map((d) => `${d.what}: ${d.when}${d.confident ? "" : " (not certain)"}`);
      await client.add(`user_${args.userId}`, {
        id: args.screenshotId,
        content: [
          `Title: ${args.title}`,
          `Room: ${args.category}`,
          `Summary: ${args.summary}`,
          dates.length > 0 ? `Dates: ${dates.join("; ")}` : "",
          `Text: ${args.text}`,
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: { screenshotId: args.screenshotId, kind: "screenshot", category: args.category },
        dreaming: "instant",
      });
      await ctx.runMutation(internal.extract.markMemoryStored, { screenshotId: args.screenshotId });
    } catch (e) {
      console.error("Supermemory store failed", e instanceof Error ? e.message : String(e));
    }
  },
});
