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

const LIBRARY_SIZE = 50;

// The fallback library the ask model sees: the newest ready, unhidden screenshots. Suggestions
// choose from this same set so every chip is answerable. Rows come newest first by takenAt.
export function askLibrary<T extends { status: string; hidden?: boolean }>(rowsNewestFirst: T[]): T[] {
  return rowsNewestFirst.filter((r) => r.status === "ready" && r.hidden !== true).slice(0, LIBRARY_SIZE);
}

// hitIds are screenshot ids that a memory search returned. liveHitIds are the ones that are still this user's
// readable screenshots: memory can lag behind a delete, and its results must not bring a removed screenshot back.
export const context = internalQuery({
  args: { userId: v.id("users"), hitIds: v.optional(v.array(v.string())) },
  handler: async (ctx, { userId, hitIds }) => {
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const ready = askLibrary(rows);
    const recent = [...ready]
      .sort((a, b) => (b.readAt ?? b._creationTime) - (a.readAt ?? a._creationTime))
      .slice(0, 3);
    const liveHitIds: string[] = [];
    for (const raw of new Set(hitIds ?? [])) {
      const id = ctx.db.normalizeId("screenshots", raw);
      const row = id === null ? null : await ctx.db.get(id);
      if (row !== null && row.userId === userId && row.status === "ready" && row.hidden !== true) liveHitIds.push(raw);
    }
    const user = await ctx.db.get(userId);
    return { recent: recent.map(brief), library: ready.map(brief), liveHitIds, timeZone: user?.timeZone ?? null };
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
