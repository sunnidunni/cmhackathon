import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { toCard } from "./lib/cards";
import { computePick } from "./lib/handful";
import { localDay } from "./lib/time";

export const get = query({
  args: { tzOffsetMinutes: v.number() },
  handler: async (ctx, { tzOffsetMinutes: tz }) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const day = localDay(now, tz);
    const user = await ctx.db.get(userId);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user_dueAt", (q) => q.eq("userId", userId))
      .collect();
    const byId = new Map(rows.map((r) => [r._id as string, r]));
    const ready = (r: Doc<"screenshots">) => r.status === "ready" && r.hidden !== true && r.doneAt === undefined;

    const lastOpened = user?.lastOpenedAt ?? 0;
    const justRows = rows
      .filter((r) => ready(r) && (r.importance ?? 1) >= 4 && (r.readAt ?? 0) > lastOpened && (r.openedAt ?? 0) < (r.readAt ?? 0))
      .sort((a, b) => (b.readAt ?? 0) - (a.readAt ?? 0))
      .slice(0, 3);

    const missedRows: Doc<"screenshots">[] = [];
    for (const rem of [...reminders].filter((r) => r.status === "sent").sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0))) {
      const row = byId.get(rem.screenshotId as string);
      if (!row || row.doneAt !== undefined || missedRows.includes(row)) continue;
      if ((row.openedAt ?? 0) >= (rem.sentAt ?? 0)) continue;
      missedRows.push(row);
    }

    const stored = await ctx.db
      .query("dailyPicks")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", day))
      .first();
    const pick = stored ?? computePick(rows, now, tz);
    const shown = new Set([...justRows, ...missedRows].map((r) => r._id as string));
    const pickRows = pick.ids
      .map((id) => byId.get(id as string))
      .filter((r): r is Doc<"screenshots"> => r !== undefined && ready(r) && !shown.has(r._id as string));

    const handfulRows = pick.thin ? [] : pickRows;
    const thinRow = pick.thin ? (pickRows[0] ?? null) : null;
    const justIn = await Promise.all(justRows.map((r) => toCard(ctx, r, reminders, "justIn", now, tz)));
    const missed = await Promise.all(missedRows.map((r) => toCard(ctx, r, reminders, "missed", now, tz)));
    const handful = await Promise.all(handfulRows.map((r) => toCard(ctx, r, reminders, "handful", now, tz)));
    const thin = thinRow ? await toCard(ctx, thinRow, reminders, "thin", now, tz) : null;

    const visible = rows.filter((r) => r.hidden !== true);
    const count = (s: string) => visible.filter((r) => r.status === s).length;
    return {
      day,
      justIn,
      missed,
      handful,
      thin,
      cleared: justIn.length + missed.length + handful.length === 0 && thin === null,
      reading: {
        read: count("ready"),
        total: visible.length,
        pending: count("uploaded") + count("processing"),
        failed: count("failed"),
      },
    };
  },
});

export const appOpened = mutation({
  args: { tzOffsetMinutes: v.number() },
  handler: async (ctx, { tzOffsetMinutes: tz }) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    await ctx.db.patch(userId, { lastOpenedAt: now });
    const day = localDay(now, tz);
    const existing = await ctx.db
      .query("dailyPicks")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", day))
      .first();
    if (existing) return null;
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    await ctx.db.insert("dailyPicks", { userId, day, ...computePick(rows, now, tz) });
    return null;
  },
});
