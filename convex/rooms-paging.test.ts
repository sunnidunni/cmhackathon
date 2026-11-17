/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));

const modules = import.meta.glob("./**/*.ts");
type Cat = "deadlines" | "chats" | "money" | "ideas" | "unsorted";

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const shot = (title: string, takenAt: number, extra: Record<string, unknown> = {}, owner: Id<"users"> = userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", { userId: owner, deviceAssetId: title, storageId: await ctx.storage.store(new Blob(["x"])), takenAt, status: "ready", title, category: "money" as Cat, reactionKey: "money_01", ...extra }),
    );
  const as = (id: Id<"users">) => t.withIdentity({ subject: `${id}|s` });
  return { t, userId, otherId, shot, me: as(userId), other: as(otherId) };
}

// Walks every page the way the app's list does, and returns the titles page by page.
async function pages(me: Awaited<ReturnType<typeof setup>>["me"], numItems: number, category?: Cat) {
  const out: string[][] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 50; guard++) {
    const res: { page: { title: string }[]; isDone: boolean; continueCursor: string } = await me.query(api.rooms.page, { paginationOpts: { numItems, cursor }, ...(category ? { category } : {}) });
    out.push(res.page.map((i) => i.title));
    if (res.isDone) return out;
    cursor = res.continueCursor;
  }
  throw new Error("pagination did not finish");
}

describe("rooms.page", () => {
  test("walks the whole library newest first, a page at a time, with nothing repeated or missing", async () => {
    const { me, shot } = await setup();
    for (let i = 1; i <= 7; i++) await shot(`s${i}`, i * 10);
    const walked = await pages(me, 3);
    expect(walked.flat()).toEqual(["s7", "s6", "s5", "s4", "s3", "s2", "s1"]);
    expect(walked[0]).toEqual(["s7", "s6", "s5"]);
  });

  test("one room's pages hold only that room, newest first by when the screenshot was taken", async () => {
    const { me, shot } = await setup();
    // Created out of order on purpose: the order must come from takenAt, not from when the row was made.
    await shot("money old", 10);
    await shot("idea", 50, { category: "ideas" });
    await shot("money new", 90);
    await shot("money mid", 40);
    expect((await pages(me, 2, "money")).flat()).toEqual(["money new", "money mid", "money old"]);
    expect((await pages(me, 2, "ideas")).flat()).toEqual(["idea"]);
    expect((await pages(me, 2, "chats")).flat()).toEqual([]);
  });

  test("leaves out screenshots that are not ready, or hidden", async () => {
    const { me, shot } = await setup();
    await shot("ready", 10);
    await shot("still reading", 20, { status: "processing" });
    await shot("failed", 30, { status: "failed" });
    await shot("hidden", 40, { hidden: true });
    expect((await pages(me, 10)).flat()).toEqual(["ready"]);
  });

  test("each item has what the grid shows, and never another person's screenshot", async () => {
    const { me, other, shot, otherId } = await setup();
    await shot("bill", 10, { dates: [{ when: "11-21", what: "x", confident: false }, { when: "2026-11-16", what: "due", confident: true }] });
    await shot("theirs", 20, {}, otherId);
    const res = await me.query(api.rooms.page, { paginationOpts: { numItems: 10, cursor: null } });
    expect(res.page).toHaveLength(1);
    expect(res.page[0]).toMatchObject({ title: "bill", date: "2026-11-16", lineKey: "money_01", category: "money", takenAt: 10 });
    expect(res.page[0].imageUrl).toBeTypeOf("string");
    expect(Object.keys(res.page[0])).not.toContain("text");
    expect((await pages(other, 10)).flat()).toEqual(["theirs"]);
  });
});

describe("rooms.recent", () => {
  test("gives the newest ready screenshots up to the limit, skipping ones still being read", async () => {
    const { me, shot } = await setup();
    for (let i = 1; i <= 6; i++) await shot(`s${i}`, i * 10);
    await shot("uploading", 100, { status: "uploaded" });
    await shot("reading", 99, { status: "processing" });
    expect((await me.query(api.rooms.recent, { limit: 4 })).map((i) => i.title)).toEqual(["s6", "s5", "s4", "s3"]);
    expect(await me.query(api.rooms.recent, { limit: 0 })).toEqual([]);
  });

  test("ready screenshots are found even when a long run of newer ones is not ready", async () => {
    const { me, shot } = await setup();
    await shot("ready old", 1);
    await shot("ready older", 0);
    // 150 newer screenshots that failed, or are still waiting: more than three times the limit asked for below.
    for (let i = 0; i < 150; i++) await shot(`stuck ${i}`, 100 + i, { status: i % 2 ? "failed" : "uploaded" });
    expect((await me.query(api.rooms.recent, { limit: 40 })).map((i) => i.title)).toEqual(["ready old", "ready older"]);
  });

  test("never returns more than 100, whatever is asked, and only the caller's", async () => {
    const { me, other, shot } = await setup();
    for (let i = 0; i < 120; i++) await shot(`s${i}`, i);
    expect(await me.query(api.rooms.recent, { limit: 5000 })).toHaveLength(100);
    expect(await other.query(api.rooms.recent, { limit: 10 })).toEqual([]);
  });
});

describe("todos.list", () => {
  test("each to-do carries its screenshot's room and confident date; one with no screenshot, or whose screenshot is gone, carries none", async () => {
    const { me, shot, t, userId } = await setup();
    const bill = await shot("bill", 10, { dates: [{ when: "2026-11-16", what: "due", confident: true }] });
    const gone = await shot("gone", 20);
    await t.run(async (ctx) => {
      await ctx.db.insert("todos", { userId, text: "Pay the bill", done: false, screenshotId: bill, createdAt: 3 });
      await ctx.db.insert("todos", { userId, text: "Typed by hand", done: false, createdAt: 2 });
      await ctx.db.insert("todos", { userId, text: "From a removed one", done: false, screenshotId: gone, createdAt: 1 });
      await ctx.db.delete(gone);
    });
    const list = await me.query(api.todos.list, {});
    expect(list.map((x) => [x.text, x.shot])).toEqual([
      ["Pay the bill", { category: "money", date: "2026-11-16" }],
      ["Typed by hand", null],
      ["From a removed one", null],
    ]);
  });
});
