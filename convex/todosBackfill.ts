import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { todosFromText } from "./lib/llm";
import { insertTodos } from "./todos";

const BATCH = 60;
const CHUNK = 8;
const SKIP_ROOMS = new Set(["ideas", "unsorted"]);

export const batch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const ready = await ctx.db
      .query("screenshots")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .collect();
    const todo = ready.filter((r) => r.todosExtracted !== true);
    return {
      remaining: todo.length,
      rows: todo.slice(0, BATCH).map((r) => ({
        id: r._id,
        skip: SKIP_ROOMS.has(r.category ?? "unsorted") || !(r.text ?? r.summary),
        title: r.title ?? "",
        summary: r.summary ?? "",
        text: r.text ?? "",
        dates: (r.dates ?? []).map((d) => `${d.what}: ${d.when}${d.confident ? "" : " (not certain)"}`),
      })),
    };
  },
});

export const apply = internalMutation({
  args: { screenshotId: v.id("screenshots"), todos: v.array(v.string()) },
  handler: async (ctx, { screenshotId, todos }) => {
    const row = await ctx.db.get(screenshotId);
    if (row === null || row.todosExtracted === true) return;
    await insertTodos(ctx, row.userId, screenshotId, todos);
    await ctx.db.patch(screenshotId, { todosExtracted: true });
  },
});

// Text-only pass over screenshots read before to-dos existed, in bounded batches. Ideas and unsorted
// are marked without a call. A failed call leaves the row unmarked for the next run.
export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const { rows, remaining } = await ctx.runQuery(internal.todosBackfill.batch, {});
    if (rows.length === 0) return;
    let progressed = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await Promise.all(
        rows.slice(i, i + CHUNK).map(async (row) => {
          try {
            const todos = row.skip ? [] : await todosFromText(row);
            await ctx.runMutation(internal.todosBackfill.apply, { screenshotId: row.id, todos });
            progressed++;
          } catch (e) {
            console.error("To-do backfill failed for one screenshot", e instanceof Error ? e.message : String(e));
          }
        }),
      );
    }
    if (remaining > rows.length && progressed > 0) await ctx.scheduler.runAfter(0, internal.todosBackfill.run, {});
  },
});
