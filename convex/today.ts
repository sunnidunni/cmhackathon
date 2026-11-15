import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { toCard } from "./lib/cards";
import { computePick, pickIsStale } from "./lib/handful";
import { localDay } from "./lib/time";

function dayHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

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
    const fresh = computePick(rows, now, tz);
    const pick = stored && !pickIsStale(stored, fresh) ? stored : fresh;
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

    const DAY = 86400000;
    const resurfacedRow = rows
      .filter(
        (r) =>
          ready(r) &&
          (r.category ?? "unsorted") === "ideas" &&
          r.takenAt <= now - 2 * DAY &&
          (r.openedAt ?? 0) < now - 7 * DAY,
      )
      .map((r) => ({ r, h: dayHash(day + (r._id as string)) }))
      .sort((a, b) => a.h - b.h)[0]?.r;
    const resurfaced = resurfacedRow ? await toCard(ctx, resurfacedRow, reminders, "thin", now, tz) : null;

    const remindersOut = [];
    for (const rem of reminders
      .filter((x) => x.status === "scheduled")
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, 20)) {
      const row = byId.get(rem.screenshotId as string);
      if (!row) continue;
      remindersOut.push({
        reminderId: rem._id,
        screenshotId: row._id,
        title: row.title ?? "",
        imageUrl: await ctx.storage.getUrl(row.storageId),
        category: row.category ?? "unsorted",
        dueAt: rem.dueAt,
        when: rem.whenKey ?? null,
        what: (row.dates ?? []).find((d) => d.when === rem.whenKey)?.what ?? null,
      });
    }

    const visible = rows.filter((r) => r.hidden !== true);
    const count = (s: string) => visible.filter((r) => r.status === s).length;
    return {
      day,
      justIn,
      missed,
      handful,
      thin,
      reminders: remindersOut,
      resurfaced,
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
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .collect();
    const fresh = computePick(rows, now, tz);
    if (!existing) await ctx.db.insert("dailyPicks", { userId, day, ...fresh });
    else if (pickIsStale(existing, fresh)) await ctx.db.patch(existing._id, fresh);
    return null;
  },
});
