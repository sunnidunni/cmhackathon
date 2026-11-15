/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeMemory: vi.fn() }));
const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const mk = () => t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const userId = await mk();
  const otherId = await mk();
  return {
    t,
    userId,
    me: t.withIdentity({ subject: `${userId}|s` }),
    other: t.withIdentity({ subject: `${otherId}|s` }),
  };
}

describe("todos", () => {
  test("add trims, validates length, and list shows open newest first then done", async () => {
    const { me } = await setup();
    const a = await me.mutation(api.todos.add, { text: "  buy milk  " });
    await new Promise((r) => setTimeout(r, 5));
    const b = await me.mutation(api.todos.add, { text: "call mum" });
    const c = await me.mutation(api.todos.add, { text: "pay rent" });
    await expect(me.mutation(api.todos.add, { text: "   " })).rejects.toThrow();
    await expect(me.mutation(api.todos.add, { text: "x".repeat(201) })).rejects.toThrow();
    await me.mutation(api.todos.toggle, { id: b });
    const list = await me.query(api.todos.list, {});
    expect(list.map((x) => [x.text, x.done])).toEqual([
      ["pay rent", false],
      ["buy milk", false],
      ["call mum", true],
    ]);
    expect(list[1]).toMatchObject({ _id: a, screenshotId: null });
    expect(list[0]._id).toBe(c);
    await me.mutation(api.todos.toggle, { id: b });
    expect((await me.query(api.todos.list, {})).every((x) => !x.done)).toBe(true);
  });

  test("remove deletes, and everything is private to the caller", async () => {
    const { me, other } = await setup();
    const id = await me.mutation(api.todos.add, { text: "mine" });
    expect(await other.query(api.todos.list, {})).toEqual([]);
    await expect(other.mutation(api.todos.toggle, { id })).rejects.toThrow();
    await expect(other.mutation(api.todos.remove, { id })).rejects.toThrow();
    await me.mutation(api.todos.remove, { id });
    expect(await me.query(api.todos.list, {})).toEqual([]);
  });

  test("removing a screenshot clears the link and keeps the todo; removeAll deletes todos", async () => {
    const { me, t, userId } = await setup();
    const shot = await t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId,
        deviceAssetId: "a",
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: 1,
        status: "ready",
      }),
    );
    await me.mutation(api.todos.add, { text: "linked", screenshotId: shot });
    expect((await me.query(api.todos.list, {}))[0].screenshotId).toBe(shot);
    await me.mutation(api.shots.remove, { id: shot });
    const after = await me.query(api.todos.list, {});
    expect(after).toHaveLength(1);
    expect(after[0].screenshotId).toBeNull();
    await me.mutation(api.shots.removeAll, {});
    expect(await me.query(api.todos.list, {})).toEqual([]);
  });

  test("a todo cannot link to another user's screenshot", async () => {
    const { me, t } = await setup();
    const otherUser = await t.run((ctx) => ctx.db.insert("users", {}));
    const theirs = await t.run(async (ctx) =>
      ctx.db.insert("screenshots", { userId: otherUser, deviceAssetId: "z", storageId: await ctx.storage.store(new Blob(["x"])), takenAt: 1, status: "ready" }),
    );
    await expect(me.mutation(api.todos.add, { text: "x", screenshotId: theirs })).rejects.toThrow();
  });
});
