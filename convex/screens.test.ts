/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { PLAYFUL_KEYS, SERIOUS_KEYS } from "./lib/lines";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));

const modules = import.meta.glob("./**/*.ts");
const TZ = 480;
const tomorrow = () => new Date(Date.now() - TZ * 60000 + 86400000).toISOString().slice(0, 10);

type Seed = {
  title: string;
  category?: "deadlines" | "chats" | "money" | "ideas" | "unsorted";
  importance?: number;
  dates?: { when: string; what: string; confident: boolean }[];
  readAt?: number;
  takenAt?: number;
  status?: "ready" | "failed" | "uploaded";
};

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const seed = (s: Seed, owner = userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId: s.title,
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: s.takenAt ?? 1000,
        status: s.status ?? "ready",
        title: s.title,
        category: s.category ?? "ideas",
        importance: s.importance ?? 1,
        dates: s.dates ?? [],
        reactionKey: "ideas_01",
        readAt: s.readAt ?? 5000,
      }),
    );
  return { t, userId, otherId, seed, me: t.withIdentity({ subject: `${userId}|s` }), other: t.withIdentity({ subject: `${otherId}|s` }) };
}

describe("today", () => {
  test("handful: one per room, soonest date first, at most three, stable after done", async () => {
    const { me, seed } = await setup();
    const d = (n: number) => ({ when: new Date(Date.now() + n * 86400000).toISOString().slice(0, 10), what: "x", confident: true });
    const a = await seed({ title: "flyer", category: "deadlines", importance: 4, dates: [d(5)] });
    await seed({ title: "second deadline", category: "deadlines", importance: 5, dates: [d(2)] });
    const bill = await seed({ title: "bill", category: "money", importance: 5, dates: [d(3)] });
    const idea = await seed({ title: "idea", category: "ideas", importance: 4 });
    await seed({ title: "chat", category: "chats", importance: 4, dates: [d(1)] });
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    const first = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(first.handful.map((c) => c.title)).toEqual(["chat", "second deadline", "bill"]);
    expect(first.thin).toBeNull();
    await me.mutation(api.shots.done, { id: bill });
    const after = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(after.handful.map((c) => c.title)).toEqual(["chat", "second deadline"]);
    expect([a, idea]).toHaveLength(2);
  });

  test("a pick made on an empty library gives way once ready screenshots exist", async () => {
    const { me, seed, t, userId } = await setup();
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).handful).toEqual([]);
    const flyer = await seed({ title: "flyer", category: "deadlines", importance: 4, readAt: 2000 });
    await t.run((ctx) => ctx.db.patch(userId, { lastOpenedAt: 3000 }));
    const read = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(read.handful.map((c) => c._id)).toEqual([flyer]);
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    const stored = await t.run((ctx) => ctx.db.query("dailyPicks").collect());
    expect(stored).toHaveLength(1);
    expect(stored[0].ids).toEqual([flyer]);
  });

  test("a stored pick with items stays stable for the day", async () => {
    const { me, seed, t, userId } = await setup();
    const first = await seed({ title: "first", category: "deadlines", importance: 4, readAt: 1 });
    await t.run((ctx) => ctx.db.patch(userId, { lastOpenedAt: 3000 }));
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    await seed({ title: "better", category: "money", importance: 5, readAt: 1 });
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).handful.map((c) => c._id)).toEqual([first]);
  });

  test("a quiet thin pick gives way when an important screenshot arrives", async () => {
    const { me, seed, t, userId } = await setup();
    await seed({ title: "recipe", category: "ideas", importance: 1, takenAt: 10, readAt: 1 });
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: TZ });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).thin?.title).toBe("recipe");
    const flyer = await seed({ title: "flyer", category: "deadlines", importance: 4, readAt: 1 });
    await t.run((ctx) => ctx.db.patch(userId, { lastOpenedAt: 3000 }));
    const r = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(r.handful.map((c) => c._id)).toEqual([flyer]);
    expect(r.thin).toBeNull();
  });

  test("thin day shows one quiet ideas item, cleared when nothing", async () => {
    const { me, seed } = await setup();
    const empty = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(empty.cleared).toBe(true);
    const old = await seed({ title: "old recipe", category: "ideas", importance: 1, takenAt: 10 });
    await seed({ title: "new recipe", category: "ideas", importance: 2, takenAt: 20 });
    const day = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(day.handful).toEqual([]);
    expect(day.thin?._id).toBe(old);
    expect(day.thin?.actions).toEqual({ primary: "keep", secondary: "delete" });
    await me.mutation(api.shots.keep, { id: old });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).thin?.title).toBe("new recipe");
  });

  test("just in: read since the app was last opened, and opening removes it", async () => {
    const { me, seed, t, userId } = await setup();
    await t.run((ctx) => ctx.db.patch(userId, { lastOpenedAt: 1000 }));
    const flyer = await seed({ title: "flyer", category: "deadlines", importance: 4, readAt: 2000 });
    await seed({ title: "old", category: "deadlines", importance: 5, readAt: 500 });
    await seed({ title: "low", category: "ideas", importance: 2, readAt: 2000 });
    const r = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(r.justIn.map((c) => c.title)).toEqual(["flyer"]);
    await me.mutation(api.shots.markOpened, { id: flyer });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).justIn).toEqual([]);
  });

  test("reading counts and failed", async () => {
    const { me, seed } = await setup();
    await seed({ title: "a" });
    await seed({ title: "b", status: "uploaded" });
    await seed({ title: "c", status: "failed" });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).reading).toEqual({ read: 1, total: 3, pending: 1, failed: 1 });
  });
});

describe("rooms, detail and mutations", () => {
  test("rooms.list has five rooms in fixed order with counts", async () => {
    const { me, seed } = await setup();
    await seed({ title: "x", category: "money", takenAt: 5 });
    await seed({ title: "y", category: "money", takenAt: 9 });
    const rooms = await me.query(api.rooms.list, {});
    expect(rooms.map((r) => r.category)).toEqual(["deadlines", "chats", "money", "ideas", "unsorted"]);
    const money = rooms[2];
    expect(money.count).toBe(2);
    expect(money.newest?.title).toBe("y");
    expect(rooms[0]).toMatchObject({ count: 0, newest: null });
    const room = await me.query(api.rooms.get, { category: "money" });
    expect(room.items.map((i) => i.title)).toEqual(["y", "x"]);
  });

  test("rooms.all lists every ready screenshot across rooms, newest first, with category", async () => {
    const { me, other, seed, t } = await setup();
    await seed({ title: "old idea", category: "ideas", takenAt: 5 });
    const noCat = await seed({ title: "no category", takenAt: 20 });
    await t.run((ctx) => ctx.db.patch(noCat, { category: undefined }));
    await seed({ title: "bill", category: "money", takenAt: 10, dates: [{ when: "2026-11-16", what: "due", confident: true }] });
    await seed({ title: "failed", category: "money", takenAt: 30, status: "failed" });
    const hidden = await seed({ title: "hidden", category: "chats", takenAt: 40 });
    await t.run((ctx) => ctx.db.patch(hidden, { hidden: true }));
    const all = await me.query(api.rooms.all, {});
    expect(all.count).toBe(3);
    expect(all.items.map((i) => [i.title, i.category])).toEqual([
      ["no category", "unsorted"],
      ["bill", "money"],
      ["old idea", "ideas"],
    ]);
    expect(all.items[1]).toMatchObject({ date: "2026-11-16", lineKey: "ideas_01" });
    expect(all.items[1].imageUrl).toBeTypeOf("string");
    expect(await other.query(api.rooms.all, {})).toEqual({ count: 0, items: [] });
  });

  test("move sets userMoved and extraction never moves it again", async () => {
    const { me, seed, t } = await setup();
    const id = await seed({ title: "x", category: "ideas" });
    await me.mutation(api.shots.move, { id, category: "deadlines" });
    const d = await me.query(api.shots.detail, { id });
    expect(d).toMatchObject({ category: "deadlines", userMoved: true });
    await t.run((ctx) => ctx.db.patch(id, { status: "processing" }));
    await t.mutation(internal.extract.complete, {
      screenshotId: id, title: "x", text: "", summary: "", category: "money", reason: "", dates: [], importance: 1, reactionKey: "money_01",
    });
    expect((await me.query(api.shots.detail, { id }))?.category).toBe("deadlines");
  });

  test("a moved screenshot gets a line key from its new room", async () => {
    const { me, seed, t } = await setup();
    const id = await seed({ title: "x", category: "unsorted" });
    await t.run((ctx) => ctx.db.patch(id, { reactionKey: "unsorted_03" }));
    await me.mutation(api.shots.move, { id, category: "ideas" });
    const d = await me.query(api.shots.detail, { id });
    expect(PLAYFUL_KEYS.ideas).toContain(d?.lineKey);
    const room = await me.query(api.rooms.get, { category: "ideas" });
    expect(PLAYFUL_KEYS.ideas).toContain(room.items[0].lineKey);
    expect(PLAYFUL_KEYS.ideas).toContain(room.newestLineKey);
    await me.mutation(api.shots.move, { id, category: "money" });
    expect(PLAYFUL_KEYS.money).toContain((await me.query(api.shots.detail, { id }))?.lineKey);
  });

  test("a moved urgent screenshot gets a serious line key of the new room", async () => {
    const { me, seed } = await setup();
    const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const id = await seed({ title: "x", category: "unsorted", importance: 5, dates: [{ when: soon, what: "due", confident: true }] });
    await me.mutation(api.shots.move, { id, category: "money" });
    expect(SERIOUS_KEYS.money).toContain((await me.query(api.shots.detail, { id }))?.lineKey);
    const calm = await seed({ title: "y", category: "unsorted", importance: 2 });
    await me.mutation(api.shots.move, { id: calm, category: "money" });
    expect(PLAYFUL_KEYS.money).toContain((await me.query(api.shots.detail, { id: calm }))?.lineKey);
  });

  test("detail and mutations are private to the owner", async () => {
    const { me, other, seed } = await setup();
    const id = await seed({ title: "mine" });
    expect(await other.query(api.shots.detail, { id })).toBeNull();
    await expect(other.mutation(api.shots.done, { id })).rejects.toThrow();
    await expect(other.mutation(api.shots.remove, { id })).rejects.toThrow();
    expect(await me.query(api.shots.detail, { id })).not.toBeNull();
  });

  test("remove deletes the row, the file and the memory; removeAll clears everything", async () => {
    const { me, seed, t, userId } = await setup();
    const id = await seed({ title: "gone" });
    const storageId = (await t.run((ctx) => ctx.db.get(id)))!.storageId;
    await me.mutation(api.shots.remove, { id });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
    expect(await t.run((ctx) => ctx.storage.getUrl(storageId))).toBeNull();
    await seed({ title: "a" });
    await seed({ title: "b" });
    await me.mutation(api.shots.removeAll, {});
    expect(await t.run((ctx) => ctx.db.query("screenshots").collect())).toHaveLength(0);
    expect(userId).toBeTruthy();
  });
});

describe("reminders", () => {
  async function withDate() {
    const s = await setup();
    const when = tomorrow() + "T18:30";
    const id = await s.seed({ title: "Harvest Lantern Night", category: "deadlines", importance: 4, dates: [{ when, what: "event", confident: true }, { when: "11-21", what: "x", confident: false }] });
    return { ...s, id, when };
  }

  test("set stores a scheduled reminder with Psst text and replaces the old one", async () => {
    const { me, id, t, when } = await withDate();
    const r = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(r.text).toBe("Psst: Harvest Lantern Night is tomorrow at 6:30 PM. Want to see it?");
    expect(r.dueAt).toBeGreaterThan(Date.now());
    const detail = await me.query(api.shots.detail, { id });
    expect(detail?.dates[0].reminder).toMatchObject({ state: "scheduled", dueAt: r.dueAt });
    expect(detail?.dates[1].reminder).toBeNull();
    const r2 = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ, when });
    const rows = await t.run((ctx) => ctx.db.query("reminders").collect());
    expect(rows.filter((x) => x.status === "scheduled").map((x) => x._id)).toEqual([r2.reminderId]);
  });

  test("a screenshot with no confident date cannot be reminded", async () => {
    const { me, seed } = await setup();
    const id = await seed({ title: "idea", dates: [{ when: "11-21", what: "x", confident: false }] });
    await expect(me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ })).rejects.toThrow("No confident date");
  });

  test("the scheduled function marks it sent, which puts the screenshot under missed until opened", async () => {
    const { me, id, t } = await withDate();
    const r = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    await t.mutation(internal.reminders.fire, { reminderId: r.reminderId });
    const day = await me.query(api.today.get, { tzOffsetMinutes: TZ });
    expect(day.missed.map((c) => c._id)).toEqual([id]);
    expect(day.missed[0].actions).toEqual({ primary: "see", secondary: "done" });
    await me.mutation(api.shots.markOpened, { id });
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).missed).toEqual([]);
  });

  test("cancel dismisses and fire then does nothing", async () => {
    const { me, id, t } = await withDate();
    const r = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    await me.mutation(api.reminders.cancel, { reminderId: r.reminderId });
    await t.mutation(internal.reminders.fire, { reminderId: r.reminderId });
    expect((await t.run((ctx) => ctx.db.get(r.reminderId)))?.status).toBe("dismissed");
  });

  test("fire now marks it sent at once with the text, and works with no reminder set", async () => {
    const { me, id, t, seed } = await withDate();
    const first = await me.mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(first.text).toMatch(/^Psst: Harvest Lantern Night is tomorrow at 6:30 PM/);
    expect((await t.run((ctx) => ctx.db.get(first.reminderId)))?.status).toBe("sent");
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).missed.map((c) => c._id)).toEqual([id]);

    const bare = await seed({ title: "plain" });
    const second = await me.mutation(api.reminders.fireNow, { screenshotId: bare, tzOffsetMinutes: TZ });
    expect(second.text).toBe("Psst: your plain is waiting. Want to see it?");
    expect((await t.run((ctx) => ctx.db.get(second.reminderId)))?.status).toBe("sent");
  });

  test("fire now after set sends the existing reminder, no duplicate", async () => {
    const { me, id, t } = await withDate();
    const r = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    const f = await me.mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(f.reminderId).toBe(r.reminderId);
    expect(await t.run((ctx) => ctx.db.query("reminders").collect())).toHaveLength(1);
    const id2: Id<"reminders"> = r.reminderId;
    expect((await t.run((ctx) => ctx.db.get(id2)))?.status).toBe("sent");
  });
});
