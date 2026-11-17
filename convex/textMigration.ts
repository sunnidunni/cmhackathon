import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { writeText } from "./lib/shotText";

// One-time move of screenshot text out of the screenshots table (see lib/shotText.ts for why).
// Run once per deployment after deploying this code:  npx convex run textMigration:run
// It walks every screenshot in batches and reschedules itself until done. Running it again is harmless.
// Until it has run, old screenshots keep working; their lists are just as heavy as before.
// Once every deployment has run it, this file and the `text` field on screenshots can be removed.
const BATCH = 100;

export const run = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("screenshots").paginate({ cursor: cursor ?? null, numItems: BATCH });
    let moved = 0;
    for (const row of page.page) {
      if (row.text === undefined) continue;
      await writeText(ctx, row, row.text);
      await ctx.db.patch(row._id, { text: undefined });
      moved++;
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.textMigration.run, { cursor: page.continueCursor });
    return { moved, done: page.isDone };
  },
});
