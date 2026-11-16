import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { nextConfidentDate } from "./lib/handful";
import { notificationText } from "./lib/notificationText";
import { computeDueAt } from "./lib/time";

async function ownedScreenshot(ctx: MutationCtx, id: Id<"screenshots">) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (row === null || row.userId !== userId) throw new Error("Screenshot not found");
  return { userId, row };
}

async function dismissActive(ctx: MutationCtx, screenshotId: Id<"screenshots">) {
  const existing = await ctx.db
    .query("reminders")
    .withIndex("by_screenshot", (q) => q.eq("screenshotId", screenshotId))
    .collect();
  for (const r of existing.filter((x) => x.status === "scheduled")) {
    if (r.scheduledId) await ctx.scheduler.cancel(r.scheduledId).catch(() => undefined);
    await ctx.db.patch(r._id, { status: "dismissed", scheduledId: undefined });
  }
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

export const set = mutation({
  args: { screenshotId: v.id("screenshots"), tzOffsetMinutes: v.number(), when: v.optional(v.string()) },
  handler: async (ctx, { screenshotId, tzOffsetMinutes: tz, when }) => {
    const { userId, row } = await ownedScreenshot(ctx, screenshotId);
    const now = Date.now();
    const date = when
      ? (row.dates ?? []).find((d) => d.when === when && d.confident)
      : nextConfidentDate(row, now, tz);
    if (!date) throw new Error("No confident date");
    const dueAt = computeDueAt(date.when, now, tz);
    await dismissActive(ctx, screenshotId);
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
    return { reminderId, dueAt, text: message };
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

async function sendToLine(ctx: MutationCtx, userId: Id<"users">, reminderId: Id<"reminders">) {
  if (!process.env.LINE_USER_ID || process.env.LINE_USER_ID !== userId) return;
  await ctx.scheduler.runAfter(0, internal.line.sendReminder, { reminderId });
}

// Called by the scheduler at dueAt, independent of notification permission on the phone.
export const fire = internalMutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const r = await ctx.db.get(reminderId);
    if (r === null || r.status !== "scheduled") return;
    await ctx.db.patch(reminderId, { status: "sent", sentAt: Date.now(), scheduledId: undefined });
    await sendToLine(ctx, r.userId, reminderId);
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
    await sendToLine(ctx, userId, reminderId);
    return { reminderId, text: message };
  },
});
