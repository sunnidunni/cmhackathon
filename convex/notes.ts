import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

// One note per read screenshot, built from what extraction already wrote: title, summary, the dates it
// found and any amount. The Notes tab groups them on the device, where the person's day boundaries are known.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const ready = rows.filter((r) => r.status === "ready" && r.hidden !== true && (r.title || r.summary));
    return await Promise.all(
      ready.map(async (r) => ({
        _id: r._id,
        title: r.title ?? "",
        summary: r.summary ?? "",
        category: r.category ?? "unsorted",
        takenAt: r.takenAt,
        amount: r.amount ?? null,
        dates: (r.dates ?? []).filter((d) => d.confident).map((d) => ({ when: d.when, what: d.what })),
        imageUrl: await ctx.storage.getUrl(r.storageId),
      })),
    );
  },
});
