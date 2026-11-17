/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { headlineFor } from "./lib/headline";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));
const modules = import.meta.glob("./**/*.ts");
const TZ = 480;
const DAY = 86400000;

type Seed = {
  title: string;
  category?: "deadlines" | "chats" | "money" | "ideas" | "unsorted";
  importance?: number;
  takenAt?: number;
  openedAt?: number;
  doneAt?: number;
};

async function setup(plan?: "free" | "paid") {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true, plan }));
  const seed = (s: Seed) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId,
        deviceAssetId: s.title,
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: s.takenAt ?? Date.now(),
        status: "ready",
        title: s.title,
        category: s.category ?? "ideas",
        importance: s.importance ?? 1,
        reactionKey: "ideas_01",
        readAt: 1,
        openedAt: s.openedAt,
        doneAt: s.doneAt,
      }),
    );
  return { t, userId, seed, me: t.withIdentity({ subject: `${userId}|s` }) };
}
afterEach(() => {
  delete process.env.DEV_UNLIMITED_IMPORT;
});

describe("developer switch", () => {
  test("DEV_UNLIMITED_IMPORT=1 lifts the import limit for every user", async () => {
    const { me } = await setup("free");
    expect(await me.query(api.sync.importInfo, {})).toEqual({ plan: "free", limit: 50 });
    process.env.DEV_UNLIMITED_IMPORT = "1";
    expect(await me.query(api.sync.importInfo, {})).toEqual({ plan: "free", limit: null });
    process.env.DEV_UNLIMITED_IMPORT = "0";
    expect((await me.query(api.sync.importInfo, {})).limit).toBe(50);
  });
});

describe("sync.progress", () => {
  test("uploaded counts every received screenshot, read the finished ones", async () => {
    const { me, seed, t } = await setup();
    await seed({ title: "a" });
    const b = await seed({ title: "b" });
    await t.run((ctx) => ctx.db.patch(b, { status: "uploaded" }));
    expect(await me.query(api.sync.progress, {})).toEqual({ total: 2, read: 1, failed: 0, pending: 1, uploaded: 2 });
  });
});

describe("home", () => {
  test("reminders lists scheduled reminders, soonest first, with title and label", async () => {
    const { me, seed, t, userId } = await setup();
    const a = await seed({ title: "later", category: "deadlines" });
    const b = await seed({ title: "sooner", category: "deadlines" });
    await t.run(async (ctx) => {
      await ctx.db.insert("reminders", { userId, screenshotId: a, dueAt: Date.now() + 5 * DAY, message: "m", status: "scheduled", whenKey: "2026-12-01" });
      await ctx.db.insert("reminders", { userId, screenshotId: b, dueAt: Date.now() + DAY, message: "m", status: "scheduled", whenKey: "2026-11-20" });
      await ctx.db.insert("reminders", { userId, screenshotId: a, dueAt: Date.now() + 2 * DAY, message: "m", status: "dismissed" });
      await ctx.db.patch(b, { dates: [{ when: "2026-11-20", what: "RSVP deadline", confident: true }] });
    });
    const r = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(r.reminders.map((x) => x.title)).toEqual(["sooner", "later"]);
    expect(r.reminders[0]).toMatchObject({ screenshotId: b, when: "2026-11-20", what: "RSVP deadline", category: "deadlines" });
    expect(r.reminders[0].imageUrl).toBeTypeOf("string");
    expect(r.reminders[1].what).toBeNull();
  });

  test("resurfaced is one older idea, not opened lately, stable for the day, else null", async () => {
    const { me, seed } = await setup();
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).resurfaced).toBeNull();
    await seed({ title: "fresh", takenAt: Date.now() });
    await seed({ title: "opened", takenAt: Date.now() - 30 * DAY, openedAt: Date.now() - DAY });
    await seed({ title: "done", takenAt: Date.now() - 30 * DAY, doneAt: Date.now() });
    await seed({ title: "money", category: "money", takenAt: Date.now() - 30 * DAY });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).resurfaced).toBeNull();
    for (const n of [1, 2, 3, 4]) await seed({ title: `old${n}`, takenAt: Date.now() - (10 + n) * DAY });
    const first = (await me.query(api.today.get, { tzOffsetMinutes: TZ })).resurfaced;
    const again = (await me.query(api.today.get, { tzOffsetMinutes: TZ })).resurfaced;
    expect(first?.title).toMatch(/^old/);
    expect(again?._id).toBe(first?._id);
    expect(first?.actions).toEqual({ primary: "keep", secondary: "delete" });
  });
});

describe("you", () => {
  test("counts per room in fixed order and a headline from the table", async () => {
    const { me, seed } = await setup();
    for (let i = 0; i < 4; i++) await seed({ title: `c${i}`, category: "chats" });
    await seed({ title: "m", category: "money" });
    await seed({ title: "d", category: "deadlines" });
    const you = await me.query(api.you.get, {});
    expect(you.total).toBe(6);
    expect(you.counts).toEqual([
      { category: "deadlines", count: 1 },
      { category: "chats", count: 4 },
      { category: "money", count: 1 },
      { category: "ideas", count: 0 },
      { category: "unsorted", count: 0 },
    ]);
    expect(you.headline?.lead).toBe("chats");
    expect(you.headline?.sentence).toContain("4 of them");
  });
  test("no headline under five screenshots", async () => {
    const { me, seed } = await setup();
    for (let i = 0; i < 4; i++) await seed({ title: `c${i}` });
    expect((await me.query(api.you.get, {})).headline).toBeNull();
  });
  test("headline table: leaders, ties, mixed, no old character names", () => {
    const c = (d: number, ch: number, m: number, i: number, u: number) => [
      { category: "deadlines" as const, count: d },
      { category: "chats" as const, count: ch },
      { category: "money" as const, count: m },
      { category: "ideas" as const, count: i },
      { category: "unsorted" as const, count: u },
    ];
    expect(headlineFor(c(8, 1, 1, 0, 0), 10)?.lead).toBe("deadlines");
    expect(headlineFor(c(1, 1, 7, 1, 0), 10)?.lead).toBe("money");
    expect(headlineFor(c(2, 2, 2, 2, 0), 8)?.lead).toBe("mixed");
    expect(headlineFor(c(0, 0, 0, 0, 9), 9)?.lead).toBe("mixed");
    const all = JSON.stringify([c(8, 1, 1, 0, 0), c(1, 8, 1, 0, 0), c(1, 1, 8, 0, 0), c(1, 1, 1, 7, 0), c(2, 2, 2, 2, 2)].map((x) => headlineFor(x, 10)));
    expect(all).not.toMatch(/Tock|Murmur|Penny|Wisp/);
  });
});
