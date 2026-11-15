/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const add = async (
    fields: Record<string, unknown>,
    owner = userId,
  ) => {
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["img"])));
    return await t.run((ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId: Math.random().toString(),
        storageId,
        takenAt: 1000,
        status: "ready",
        ...fields,
      } as never),
    );
  };
  return {
    t,
    add,
    otherId,
    me: t.withIdentity({ subject: `${userId}|s1` }),
    other: t.withIdentity({ subject: `${otherId}|s2` }),
  };
}

describe("library", () => {
  test("roomCounts counts ready screenshots per room, unsorted for no category, ignores hidden and other users", async () => {
    const { me, add, otherId } = await setup();
    await add({ category: "deadlines" });
    await add({ category: "deadlines" });
    await add({ category: "money" });
    await add({ category: "unsorted" });
    await add({});
    await add({ category: "chats", hidden: true });
    await add({ category: "chats", status: "processing" });
    await add({ category: "ideas" }, otherId);
    expect(await me.query(api.library.roomCounts, {})).toEqual({
      deadlines: 2,
      chats: 0,
      money: 1,
      ideas: 0,
      unsorted: 2,
      reading: 1,
    });
  });

  test("roomScreenshots returns that room newest first with image urls", async () => {
    const { me, add } = await setup();
    await add({ category: "money", takenAt: 1, title: "old" });
    await add({ category: "money", takenAt: 3, title: "new" });
    await add({ category: "chats", takenAt: 2, title: "other room" });
    const rows = await me.query(api.library.roomScreenshots, { category: "money" });
    expect(rows.map((r) => r.title)).toEqual(["new", "old"]);
    expect(rows[0].url).toBeTypeOf("string");
  });

  test("unsorted room also holds failed and still-reading screenshots", async () => {
    const { me, add } = await setup();
    await add({ category: "unsorted", title: "a" });
    await add({ status: "failed", title: "b" });
    await add({ status: "processing", title: "c" });
    await add({ category: "money", title: "d" });
    const rows = await me.query(api.library.roomScreenshots, { category: "unsorted" });
    expect(rows.map((r) => r.title).sort()).toEqual(["a", "b", "c"]);
  });

  test("missed is importance 4-5, ready, unopened, most important first, max three", async () => {
    const { me, add } = await setup();
    await add({ title: "i4 old", importance: 4, takenAt: 1 });
    await add({ title: "i5", importance: 5, takenAt: 2 });
    await add({ title: "i4 new", importance: 4, takenAt: 3 });
    await add({ title: "i5 newer", importance: 5, takenAt: 4 });
    await add({ title: "low", importance: 3 });
    await add({ title: "opened", importance: 5, openedAt: 5 });
    await add({ title: "processing", importance: 5, status: "processing" });
    await add({ title: "hidden", importance: 5, hidden: true });
    const rows = await me.query(api.library.missed, {});
    expect(rows.map((r) => r.title)).toEqual(["i5 newer", "i5", "i4 new"]);
  });

  test("markOpened takes an item off the missed list", async () => {
    const { me, add } = await setup();
    const id = await add({ title: "x", importance: 5 });
    expect(await me.query(api.library.missed, {})).toHaveLength(1);
    await me.mutation(api.library.markOpened, { id });
    expect(await me.query(api.library.missed, {})).toHaveLength(0);
  });

  test("moveTo sets category and userMoved", async () => {
    const { me, add, t } = await setup();
    const id = await add({ category: "ideas" });
    await me.mutation(api.library.moveTo, { id, category: "money" });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row).toMatchObject({ category: "money", userMoved: true });
  });

  test("one screenshot is readable by its owner only", async () => {
    const { me, other, add } = await setup();
    const id = await add({ title: "mine" });
    expect((await me.query(api.library.screenshot, { id }))?.url).toBeTypeOf("string");
    expect(await other.query(api.library.screenshot, { id })).toBeNull();
    await expect(other.mutation(api.library.moveTo, { id, category: "money" })).rejects.toThrow();
  });

  test("seedDemo inserts ready screenshots for the caller", async () => {
    const { me, t } = await setup();
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["img"])));
    await me.mutation(api.library.seedDemo, {
      items: [
        {
          storageId,
          category: "money",
          title: "Bill",
          importance: 5,
          dates: [{ when: "2026-11-16", what: "payment due", confident: true }],
        },
      ],
    });
    const counts = await me.query(api.library.roomCounts, {});
    expect(counts.money).toBe(1);
    expect(await me.query(api.library.missed, {})).toHaveLength(1);
  });
});
