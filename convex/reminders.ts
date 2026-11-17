import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { nextConfidentDate } from "./lib/handful";
import { notificationText } from "./lib/notificationText";
import { computeDueAt, isFutureWhen, isTimeZone } from "./lib/time";

async function ownedScreenshot(ctx: MutationCtx, id: Id<"screenshots">) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (row === null || row.userId !== userId) throw new Error("Screenshot not found");
  return { userId, row };
}

// Ends this screenshot's scheduled reminders. Returns their ids: each one is also a local notification
// on the phone, which only the phone can cancel.
export async function dismissActive(ctx: MutationCtx, screenshotId: Id<"screenshots">): Promise<Id<"reminders">[]> {
  const existing = await ctx.db
    .query("reminders")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", screenshotId))
    .collect();
  const active = existing.filter((x) => x.status === "scheduled");
  for (const r of active) {
    if (r.scheduledId) await ctx.scheduler.cancel(r.scheduledId).catch(() => undefined);
    await ctx.db.patch(r._id, { status: "dismissed", scheduledId: undefined });
  }
  return active.map((r) => r._id);
}

const text = (row: Doc<"screenshots">, when: string | null, at: number, tz: number) =>
  notificationText({
    title: row.title ?? "screenshot",
    category: row.category,
    when,
    at,
    tz,
    amount: row.amount,
    what: (row.dates ?? []).find((d) => d.when === when)?.what,
  });

// timeZone is the phone's time zone name. With it the reminder keeps its wall-clock time across a clock change.
export const set = mutation({
  args: { screenshotId: v.id("screenshots"), tzOffsetMinutes: v.number(), when: v.optional(v.string()), timeZone: v.optional(v.string()) },
  handler: async (ctx, { screenshotId, tzOffsetMinutes: tz, when, timeZone }) => {
    const { userId, row } = await ownedScreenshot(ctx, screenshotId);
    const now = Date.now();
    const date = when
      ? (row.dates ?? []).find((d) => d.when === when && d.confident)
      : nextConfidentDate(row, now, tz);
    if (!date) throw new Error("No confident date");
    if (!isFutureWhen(date.when, now, tz)) throw new Error("That date has passed");
    const dueAt = computeDueAt(date.when, now, tz, timeZone && isTimeZone(timeZone) ? timeZone : undefined);
    const replacedReminderIds = await dismissActive(ctx, screenshotId);
    const message = text(row, date.when, dueAt, tz);
    const reminderId = await ctx.db.insert("reminders", {
      userId,
      screenshotId,
      dueAt,
      message,
      status: "scheduled",
      whenKey: date.when,
    });
    const scheduledId = await ctx.scheduler.runAt(dueAt, internal.reminders.fire, { reminderId });
    await ctx.db.patch(reminderId, { scheduledId });
    return { reminderId, dueAt, text: message, replacedReminderIds };
  },
});

export const cancel = mutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const userId = await requireUserId(ctx);
    const r = await ctx.db.get(reminderId);
    if (r === null || r.userId !== userId) throw new Error("Reminder not found");
    if (r.scheduledId) await ctx.scheduler.cancel(r.scheduledId).catch(() => undefined);
    await ctx.db.patch(reminderId, { status: "dismissed", scheduledId: undefined });
    return null;
  },
});

// Called by the scheduler at dueAt, independent of notification permission on the phone.
export const fire = internalMutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const r = await ctx.db.get(reminderId);
    if (r === null || r.status !== "scheduled") return;
    await ctx.db.patch(reminderId, { status: "sent", sentAt: Date.now(), scheduledId: undefined });
  },
});

// Demo control: make this screenshot's reminder due now and mark it sent.
export const fireNow = mutation({
  args: { screenshotId: v.id("screenshots"), tzOffsetMinutes: v.number() },
  handler: async (ctx, { screenshotId, tzOffsetMinutes: tz }) => {
    const { userId, row } = await ownedScreenshot(ctx, screenshotId);
    const now = Date.now();
    const active = (
      await ctx.db
        .query("reminders")
        .withIndex("by_screenshot", (q) => q.eq("screenshotId", screenshotId))
        .collect()
    ).find((r) => r.status === "scheduled");
    const when = active?.whenKey ?? nextConfidentDate(row, now, tz)?.when ?? null;
    const message = text(row, when, now, tz);
    if (active?.scheduledId) await ctx.scheduler.cancel(active.scheduledId).catch(() => undefined);
    const fields = { dueAt: now, message, status: "sent" as const, sentAt: now, scheduledId: undefined };
    const reminderId =
      active?._id ??
      (await ctx.db.insert("reminders", { userId, screenshotId, whenKey: when ?? undefined, ...fields }));
    if (active) await ctx.db.patch(active._id, fields);
    return { reminderId, text: message };
  },
});

// The person's reminders that are still to come, soonest first. The phone uses this to put back local
// notifications it is missing: after a reinstall, on a new phone, or when notifications were off when a reminder was set.
// `after` is the phone's clock, passed in so the answer is never an old cached one.
export const upcoming = query({
  args: { after: v.number() },
  handler: async (ctx, { after }) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("reminders")
      .withIndex("by_user_dueAt", (q) => q.eq("userId", userId).gt("dueAt", after))
      .take(300);
    return rows
      .filter((r) => r.status === "scheduled")
      .map((r) => ({ reminderId: r._id, screenshotId: r.screenshotId, dueAt: r.dueAt, text: r.message }));
  },
});
