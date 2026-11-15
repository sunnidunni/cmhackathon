import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

export type Source = { screenshotId: Doc<"screenshots">["_id"]; title: string | null; imageUrl: string | null };

const brief = (r: Doc<"screenshots">) => ({
  id: r._id as string,
  title: r.title ?? "",
  summary: r.summary ?? "",
  text: (r.text ?? "").slice(0, 600),
  dates: (r.dates ?? []).map((d) => `${d.what}: ${d.when}${d.confident ? "" : " (not certain)"}`),
});

export const context = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const ready = rows.filter((r) => r.status === "ready" && r.hidden !== true);
    const recent = [...ready]
      .sort((a, b) => (b.readAt ?? b._creationTime) - (a.readAt ?? a._creationTime))
      .slice(0, 3);
    return { recent: recent.map(brief), library: ready.slice(0, 50).map(brief) };
  },
});

export async function toSources(ctx: QueryCtx, userId: string, ids: string[]): Promise<Source[]> {
  const out: Source[] = [];
  for (const raw of new Set(ids)) {
    const id = ctx.db.normalizeId("screenshots", raw);
    if (id === null) continue;
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) continue;
    out.push({ screenshotId: id, title: row.title ?? null, imageUrl: await ctx.storage.getUrl(row.storageId) });
  }
  return out;
}

// Only screenshots that exist and belong to this user come back.
export const sources = internalQuery({
  args: { userId: v.id("users"), ids: v.array(v.string()) },
  handler: async (ctx, { userId, ids }) => await toSources(ctx, userId, ids),
});

export const save = internalMutation({
  args: {
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
    found: v.boolean(),
    sourceScreenshotIds: v.array(v.id("screenshots")),
  },
  handler: async (ctx, { sourceScreenshotIds, ...rest }) =>
    await ctx.db.insert("questions", { ...rest, sourceScreenshotIds, createdAt: Date.now() }),
});
