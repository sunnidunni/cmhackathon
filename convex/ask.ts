import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, query, type ActionCtx } from "./_generated/server";
import { askLibrary, toSources, type Source } from "./askData";
import { requireUserId } from "./lib/auth";
import { askModel } from "./lib/llm";
import { suggestionsFrom } from "./lib/suggestions";
import { addMemory, searchMemory, type MemoryHit } from "./lib/memoryClient";
import { chatDocId } from "./lib/memoryDocs";
import { todayPhrase } from "./lib/time";

export type { Source };
export const NOT_FOUND_ANSWER = "I couldn't find that in your screenshots.";

const SYSTEM = `You answer questions about the user's own screenshots. Use only the context you are given. Answer in at most two plain sentences, using only what the context says. Never guess a date, time, or price. When the question is about when something is due or happens, give the date and also any time shown for it on the same screenshot, for example "RSVP by November 16, 2026. The event starts at 6:30 PM that day." If a date is marked not certain, say it is not certain (for example "it looks like November 21, but the year isn't shown") and do not guess the year. The question may say "that" or "it": that means the most recent screenshot unless the earlier conversation says otherwise. If the context does not answer the question, set found to false. sourceIds lists the screenshot ids you used, taken from the context; use an empty list when found is false.`;

type Brief = { id: string; title: string; summary: string; text: string; dates: string[] };
const shortLine = (b: Brief) => `[id ${b.id}] ${b.title}. ${b.summary}${b.dates.length ? ` Dates: ${b.dates.join("; ")}.` : ""}`;
const line = (b: Brief) => `${shortLine(b)}${b.text ? ` Text: ${b.text}` : ""}`;

// The longest question the model is sent. The app's own field stops at 500; the rest is room for the
// "(about: ...)" note the app adds to a follow-up.
export const MAX_QUESTION = 1000;

type AskResult = { questionId: Id<"questions">; answer: string; found: boolean; sources: Source[] };

export async function answerQuestion(ctx: ActionCtx, userId: Id<"users">, q: string): Promise<AskResult> {
  let hits: MemoryHit[] = [];
  try {
    hits = await searchMemory(userId, q);
  } catch (e) {
    console.error("Supermemory search failed", e instanceof Error ? e.message : String(e));
  }
  const data = await ctx.runQuery(internal.askData.context, {
    userId,
    hitIds: hits.flatMap((h) => (h.screenshotId ? [h.screenshotId] : [])),
  });
  // Screenshot results count only while the screenshot still exists. Chat turns are earlier questions and answers.
  const live = new Set(data.liveHitIds);
  const shotHits = hits.filter((h) => h.kind !== "chat" && h.screenshotId !== null && live.has(h.screenshotId));
  const chatHits = hits.filter((h) => h.kind === "chat");

  const sections = [
    `Most recent screenshots, newest first:\n${data.recent.map(line).join("\n") || "(none)"}`,
  ];
  if (shotHits.length > 0) sections.push(`Memory search results:\n${shotHits.map((h) => `[id ${h.screenshotId}] ${h.text}`).join("\n")}`);
  if (chatHits.length > 0) sections.push(`Earlier questions and answers, for background only. Take facts from the screenshots, not from these:\n${chatHits.map((h) => h.text).join("\n")}`);
  // The library is always there, so a weak search can never hide a screenshot. With search results it is
  // listed without each screenshot's full text, which keeps the prompt small.
  sections.push(`All the user's screenshots:\n${data.library.map(shotHits.length > 0 ? shortLine : line).join("\n") || "(none)"}`);
  const system = `${SYSTEM} Today is ${todayPhrase(Date.now(), data.timeZone ?? "UTC")}.`;
  const reply = await askModel(system, `${sections.join("\n\n")}\n\nQuestion: ${q}`);

  const hitIds = shotHits.map((h) => h.screenshotId as string);
  const recentIds = data.recent.map((b) => b.id);
  let sources: Source[];
  let answer = reply.answer.trim();
  const found = reply.found && answer !== "";
  if (found) {
    sources = await ctx.runQuery(internal.askData.sources, { userId, ids: reply.sourceIds });
  } else {
    answer = NOT_FOUND_ANSWER;
    sources = (
      await ctx.runQuery(internal.askData.sources, { userId, ids: [...hitIds, ...recentIds] })
    ).slice(0, 3);
  }

  const questionId = await ctx.runMutation(internal.askData.save, {
    userId,
    question: q,
    answer,
    found,
    sourceScreenshotIds: sources.map((s) => s.screenshotId),
  });

  const turn = (role: "user" | "assistant", content: string) =>
    addMemory(userId, {
      id: chatDocId(questionId, role),
      content: `${role === "user" ? "User asked" : "Assistant answered"}: ${content}`,
      metadata: { kind: "chat", role, questionId },
    });
  const added = await Promise.allSettled([turn("user", q), turn("assistant", answer)]);
  for (const r of added)
    if (r.status === "rejected") console.error("Supermemory add failed", String(r.reason));

  return { questionId, answer, found, sources };
}

export const ask = action({
  args: { question: v.string() },
  handler: async (ctx, { question }): Promise<AskResult> => {
    const userId = await requireUserId(ctx);
    const q = question.trim().slice(0, MAX_QUESTION);
    if (q === "") throw new Error("Ask a question first");
    return answerQuestion(ctx, userId, q);
  },
});

export const suggestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("screenshots")
      .withIndex("by_user_takenAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(300);
    return suggestionsFrom(askLibrary(rows).map((r) => ({ ...r, id: r._id })));
  },
});

export const askAs = internalAction({
  args: { userId: v.id("users"), question: v.string() },
  handler: async (ctx, { userId, question }): Promise<AskResult> => answerQuestion(ctx, userId, question),
});

export const history = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("questions")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const out = [];
    for (const row of rows.reverse()) {
      out.push({
        _id: row._id,
        question: row.question,
        answer: row.answer,
        found: row.found ?? true,
        createdAt: row.createdAt,
        sources: await toSources(ctx, userId, row.sourceScreenshotIds),
      });
    }
    return out;
  },
});
