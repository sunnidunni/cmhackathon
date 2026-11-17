/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const model = vi.fn();
vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(async () => []), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));
vi.mock("./lib/llm", () => ({ askModel: (...a: unknown[]) => model(...a), todosFromText: vi.fn(async () => []) }));

const modules = import.meta.glob("./**/*.ts");

beforeEach(() => {
  vi.useFakeTimers();
  model.mockReset().mockResolvedValue({ found: false, answer: "", sourceIds: [] });
});
afterEach(() => vi.useRealTimers());

const result = { title: "Bill", text: "EVERYTHING ON THE SCREEN", summary: "s", category: "money" as const, reason: "r", dates: [], importance: 3, reactionKey: "money_01" };

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const shot = (deviceAssetId: string, extra: Record<string, unknown> = {}) =>
    t.run(async (ctx) => ctx.db.insert("screenshots", { userId, deviceAssetId, storageId: await ctx.storage.store(new Blob(["x"])), takenAt: 1000, status: "processing", startedAt: Date.now(), ...extra }));
  const texts = () => t.run((ctx) => ctx.db.query("screenshotTexts").collect());
  const get = (id: Id<"screenshots">) => t.run((ctx) => ctx.db.get(id));
  return { t, userId, shot, texts, get, me: t.withIdentity({ subject: `${userId}|s` }), settle: () => t.finishAllScheduledFunctions(vi.runAllTimers) };
}

describe("where a screenshot's text is kept", () => {
  test("reading a screenshot stores its text beside it, not on it", async () => {
    const { t, shot, texts, get, userId } = await setup();
    const id = await shot("a");
    expect(await t.mutation(internal.extract.complete, { screenshotId: id, ...result })).toBe(true);
    const row = await get(id);
    expect(row).toMatchObject({ status: "ready", title: "Bill" });
    expect(row?.text).toBeUndefined();
    expect(await texts()).toMatchObject([{ screenshotId: id, userId, text: "EVERYTHING ON THE SCREEN" }]);
  });

  test("reading it again replaces the text; there is still one row", async () => {
    const { t, shot, texts } = await setup();
    const id = await shot("a");
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result });
    await t.run((ctx) => ctx.db.patch(id, { status: "processing" }));
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result, text: "SECOND READING" });
    expect((await texts()).map((x) => x.text)).toEqual(["SECOND READING"]);
  });

  test("a screenshot read before the move, with its text still on it, is read again without leaving that old text behind", async () => {
    const { t, shot, texts, get } = await setup();
    const id = await shot("a", { text: "OLD INLINE TEXT" });
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result });
    expect((await get(id))?.text).toBeUndefined();
    expect((await texts()).map((x) => x.text)).toEqual(["EVERYTHING ON THE SCREEN"]);
  });
});

describe("what still reads the text", () => {
  test("Ask gets the text from wherever it is kept: beside the screenshot or, for an old one, on it", async () => {
    const { t, shot, me } = await setup();
    const moved = await shot("moved");
    await t.mutation(internal.extract.complete, { screenshotId: moved, ...result, title: "Moved", text: "TEXT KEPT BESIDE" });
    await shot("old", { status: "ready", title: "Old", summary: "s", text: "TEXT STILL INLINE", readAt: 1 });
    await me.action(api.ask.ask, { question: "q" });
    const prompt: string = model.mock.calls[0][1];
    expect(prompt).toContain("Text: TEXT KEPT BESIDE");
    expect(prompt).toContain("Text: TEXT STILL INLINE");
  });

  test("album sorting gets the text too", async () => {
    const { t, shot, userId } = await setup();
    const id = await shot("a");
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result });
    const albumId = await t.run((ctx) => ctx.db.insert("albums", { userId, name: "Bills", description: "", createdAt: 1, sortStatus: "sorting", sortRun: 1 }));
    const one = await t.query(internal.albums.shotForSort, { albumId, run: 1, screenshotId: id });
    expect(one?.shot.text).toBe("EVERYTHING ON THE SCREEN");
    const page = await t.query(internal.albums.sortPage, { albumId, run: 1, cursor: null });
    expect(page?.shots.map((s) => s.text)).toEqual(["EVERYTHING ON THE SCREEN"]);
  });

  test("the to-do backfill gets the text too", async () => {
    const { t, shot } = await setup();
    const id = await shot("a");
    await t.mutation(internal.extract.complete, { screenshotId: id, ...result });
    await t.run((ctx) => ctx.db.patch(id, { todosExtracted: undefined }));
    const { rows } = await t.query(internal.todosBackfill.batch, {});
    expect(rows).toMatchObject([{ id, text: "EVERYTHING ON THE SCREEN", skip: false }]);
  });
});

describe("deleting", () => {
  test("removing a screenshot removes its text; delete everything removes all of it", async () => {
    const { t, shot, texts, me, settle } = await setup();
    const ids = [];
    for (const name of ["a", "b", "c"]) {
      const id = await shot(name);
      await t.mutation(internal.extract.complete, { screenshotId: id, ...result });
      ids.push(id);
    }
    expect(await texts()).toHaveLength(3);
    await me.mutation(api.shots.remove, { id: ids[0] });
    expect((await texts()).map((x) => x.screenshotId).sort()).toEqual([ids[1], ids[2]].sort());
    await me.mutation(api.shots.removeAll, {});
    await settle();
    expect(await texts()).toEqual([]);
  });
});

describe("moving old screenshots' text over", () => {
  test("every screenshot with text on it is moved, in batches; ones already moved or with no text are left alone; running it twice changes nothing", async () => {
    const { t, shot, texts, get, settle } = await setup();
    const old: Id<"screenshots">[] = [];
    for (let i = 0; i < 230; i++) old.push(await shot(`old-${i}`, { status: "ready", text: `text ${i}` }));
    const unread = await shot("unread", { status: "uploaded" });
    const already = await shot("already");
    await t.mutation(internal.extract.complete, { screenshotId: already, ...result });

    const first = await t.mutation(internal.textMigration.run, {});
    // One batch is 100 screenshots; the rest follow by themselves.
    expect(first).toEqual({ moved: 100, done: false });
    await settle();

    for (const id of [old[0], old[150], old[229]]) expect((await get(id))?.text).toBeUndefined();
    const all = await texts();
    expect(all).toHaveLength(231);
    expect(all.find((x) => x.screenshotId === old[229])?.text).toBe("text 229");
    expect(all.find((x) => x.screenshotId === already)?.text).toBe("EVERYTHING ON THE SCREEN");
    expect(all.some((x) => x.screenshotId === unread)).toBe(false);

    await t.mutation(internal.textMigration.run, {});
    await settle();
    expect(await texts()).toHaveLength(231);
  });
});
