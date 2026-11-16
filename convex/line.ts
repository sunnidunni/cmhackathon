import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { lineText } from "./lib/lineText";

// The Psst text line. Everything comes from Convex environment variables read at call time:
// LINE_USER_ID (the one Psst user who gets line messages), TELEGRAM_BOT_TOKEN, LINE_TELEGRAM_CHAT_ID.
// With any of them missing, or for any other user, nothing is sent.
export const load = internalQuery({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const r = await ctx.db.get(reminderId);
    if (r === null) return null;
    const shot = await ctx.db.get(r.screenshotId);
    if (shot === null) return null;
    return { userId: r.userId as string, title: shot.title ?? "", amount: shot.amount, whenKey: r.whenKey };
  },
});

export const sendReminder = internalAction({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const allowed = process.env.LINE_USER_ID;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.LINE_TELEGRAM_CHAT_ID;
    if (!allowed || !token || !chatId) return;
    try {
      const data = await ctx.runQuery(internal.line.load, { reminderId });
      if (data === null || data.userId !== allowed) return;
      const text = lineText({ title: data.title, whenKey: data.whenKey, amount: data.amount });
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) console.error("Line send was refused with status", res.status);
    } catch {
      console.error("Line send failed");
    }
  },
});
