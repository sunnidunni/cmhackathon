import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// A screenshot's full text (everything readable in the image) is kept in its own table, screenshotTexts,
// one row per screenshot, and not on the screenshot itself.
//
// Why: Today, Rooms and the import progress all list a person's screenshots, and a Convex query reads whole
// documents. With the text on the screenshot, every one of those lists read every screenshot's full text and
// used none of it. At a few thousand screenshots they passed the 16 MB a query may read, and each screen failed.
//
// Screenshots read before this change still carry their text in `text`. readText handles both, and
// textMigration.run moves the old ones over.

export async function readText(ctx: QueryCtx, row: Doc<"screenshots">): Promise<string> {
  if (row.text !== undefined) return row.text;
  const kept = await ctx.db
    .query("screenshotTexts")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", row._id))
    .first();
  return kept?.text ?? "";
}

// Stores the text for a screenshot, replacing any it had. The caller clears `text` on the screenshot itself.
export async function writeText(ctx: MutationCtx, row: { _id: Id<"screenshots">; userId: Id<"users"> }, text: string) {
  const kept = await ctx.db
    .query("screenshotTexts")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", row._id))
    .first();
  if (kept === null) await ctx.db.insert("screenshotTexts", { screenshotId: row._id, userId: row.userId, text });
  else await ctx.db.patch(kept._id, { text });
}

export async function deleteText(ctx: MutationCtx, screenshotId: Id<"screenshots">) {
  const rows = await ctx.db
    .query("screenshotTexts")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", screenshotId))
    .collect();
  for (const row of rows) await ctx.db.delete(row._id);
}
