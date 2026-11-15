/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const todosFromText = vi.fn();
vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeMemory: vi.fn() }));
vi.mock("./lib/llm", () => ({ askModel: vi.fn(), todosFromText: (...a: unknown[]) => todosFromText(...a) }));
const modules = import.meta.glob("./**/*.ts");

const result = {
  title: "Bill", text: "t", summary: "s", category: "money" as const, reason: "r", dates: [], importance: 5, reactionKey: "money_01",
};

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", {}));
  const shot = (over: object = {}) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId,
        deviceAssetId: Math.random().toString(),
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: 1,
        status: "processing",
        startedAt: Date.now(),
        ...over,
      }),
    );
  return { t, userId, shot, me: t.withIdentity({ subject: `${userId}|s` }) };
}
beforeEach(() => {
  todosFromText.mockReset();
});
const realCalls = () => todosFromText.mock.calls.filter((c) => c[0] !== undefined).length;

describe("to-dos written from extraction", () => {
  test("complete inserts each to-do once, even if the screenshot is read again", async () => {
    const { t, shot, me } = await setup();
    const id = await shot();
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result, todos: ["Pay the bill"] });
    await t.run((ctx) => ctx.db.patch(id, { status: "processing" }));
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result, todos: ["Pay the bill", "Call someone"] });
    const list = await me.query(api.todos.list, {});
    expect(list.map((x) => [x.text, x.done, x.screenshotId])).toEqual([["Pay the bill", false, id]]);
  });

  test("a to-do the user ticked or deleted does not come back on a re-read", async () => {
    const { t, shot, me } = await setup();
    const id = await shot();
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result, todos: ["Pay the bill"] });
    const [todo] = await me.query(api.todos.list, {});
    await me.mutation(api.todos.remove, { id: todo._id });
    await t.run((ctx) => ctx.db.patch(id, { status: "processing" }));
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result, todos: ["Pay the bill"] });
    expect(await me.query(api.todos.list, {})).toEqual([]);
  });
});

describe("backfill for screenshots read before this change", () => {
  test("writes to-dos from stored text, marks every row, skips ideas, and never repeats", async () => {
    const { t, shot, me } = await setup();
    const bill = await shot({ status: "ready", category: "money", title: "Power bill", text: "Amount due $142.37 by Nov 16", summary: "Bill" });
    const idea = await shot({ status: "ready", category: "ideas", title: "Recipe", text: "Chicken", summary: "Recipe" });
    const chat = await shot({ status: "ready", category: "chats", title: "Chat", text: "lol", summary: "Chat" });
    todosFromText.mockImplementation(async (row?: { title: string }) => (row?.title === "Power bill" ? ["Pay the Power bill"] : []));
    await t.action(internal.todosBackfill.run, {});
    expect((await me.query(api.todos.list, {})).map((x) => [x.text, x.screenshotId])).toEqual([["Pay the Power bill", bill]]);
    expect(realCalls()).toBe(2);
    for (const id of [bill, idea, chat]) expect((await t.run((ctx) => ctx.db.get(id)))?.todosExtracted).toBe(true);
    await t.action(internal.todosBackfill.run, {});
    expect(realCalls()).toBe(2);
    expect(await me.query(api.todos.list, {})).toHaveLength(1);
  });

  test("a failed model call leaves the row unmarked so a later run retries it", async () => {
    const { t, shot } = await setup();
    const id = await shot({ status: "ready", category: "money", title: "x", text: "y" });
    todosFromText.mockRejectedValue(new Error("down"));
    await t.action(internal.todosBackfill.run, {});
    expect((await t.run((ctx) => ctx.db.get(id)))?.todosExtracted).toBeUndefined();
  });
});
