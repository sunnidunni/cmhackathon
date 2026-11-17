/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { FORGET_RETRY_MS } from "./memory";
import schema from "./schema";
import { DELETE_BATCH } from "./shots";

const addMemory = vi.fn();
const removeDocuments = vi.fn();
const removeNamespace = vi.fn();
vi.mock("./lib/memoryClient", () => ({
  addMemory: (...a: unknown[]) => addMemory(...a),
  searchMemory: vi.fn(),
  removeDocuments: (...a: unknown[]) => removeDocuments(...a),
  removeNamespace: (...a: unknown[]) => removeNamespace(...a),
}));

const modules = import.meta.glob("./**/*.ts");
const TZ = 480;
const tomorrow = () => new Date(Date.now() - TZ * 60000 + 86400000).toISOString().slice(0, 10);

beforeEach(() => {
  vi.useFakeTimers();
  addMemory.mockReset().mockResolvedValue(undefined);
  removeDocuments.mockReset().mockResolvedValue(undefined);
  removeNamespace.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const shot = (deviceAssetId: string, owner: Id<"users"> = userId, extra: Record<string, unknown> = {}) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId,
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: 1000,
        status: "ready",
        title: deviceAssetId,
        category: "deadlines",
        importance: 4,
        dates: [{ when: tomorrow() + "T18:30", what: "event", confident: true }],
        ...extra,
      }),
    );
  const upload = () => t.run((ctx) => ctx.storage.store(new Blob(["x"])));
  const count = (table: "screenshots" | "reminders" | "questions" | "todos" | "albums" | "albumShots" | "dailyPicks" | "removedAssets", owner: Id<"users"> = userId) =>
    t.run(async (ctx) => (await ctx.db.query(table).collect()).filter((r) => r.userId === owner).length);
  const settle = () => t.finishAllScheduledFunctions(vi.runAllTimers);
  return { t, userId, otherId, shot, upload, count, settle, me: t.withIdentity({ subject: `${userId}|s` }), other: t.withIdentity({ subject: `${otherId}|s` }) };
}

describe("removing one screenshot", () => {
  test("it is not offered for import again, and an upload of it is refused and discarded", async () => {
    const { me, shot, upload, count, t } = await setup();
    const id = await shot("asset-1");
    await me.mutation(api.shots.remove, { id });
    expect(await me.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: ["asset-1", "asset-2"] })).toEqual(["asset-2"]);

    const storageId = await upload();
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "asset-1", storageId, takenAt: 1 })).toBeNull();
    expect(await count("screenshots")).toBe(0);
    expect(await t.run((ctx) => ctx.storage.getUrl(storageId))).toBeNull();
  });

  test("removing the same asset twice keeps one record, and another user's copy of that asset id is untouched", async () => {
    const { me, other, shot, upload, count, otherId } = await setup();
    await me.mutation(api.shots.remove, { id: await shot("asset-1") });
    // A record for the asset already exists; this second removal must not add another.
    await me.mutation(api.shots.remove, { id: await shot("asset-1") });
    expect(await count("removedAssets")).toBe(1);

    expect(await other.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: ["asset-1"] })).toEqual(["asset-1"]);
    expect(await other.mutation(api.screenshots.create, { deviceAssetId: "asset-1", storageId: await upload(), takenAt: 1 })).not.toBeNull();
    expect(await count("screenshots", otherId)).toBe(1);
  });

  test("its reminders are deleted, their scheduled functions cancelled, and their ids returned for the phone to cancel", async () => {
    const { me, shot, count, t } = await setup();
    const id = await shot("flyer");
    const set = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    const { dismissedReminderIds } = await me.mutation(api.shots.remove, { id });
    expect(dismissedReminderIds).toEqual([set.reminderId]);
    expect(await count("reminders")).toBe(0);
    const pending = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
    expect(pending.filter((f) => f.name.includes("reminders") && f.state.kind === "pending")).toEqual([]);
  });

  test("answers that used it as a source leave Ask and memory; other answers and its to-dos stay", async () => {
    const { me, shot, count, settle, t, userId } = await setup();
    const id = await shot("flyer");
    const keptShot = await shot("receipt");
    const { quoting, kept } = await t.run(async (ctx) => ({
      quoting: await ctx.db.insert("questions", { userId, question: "when?", answer: "Friday", sourceScreenshotIds: [keptShot, id], createdAt: 1 }),
      kept: await ctx.db.insert("questions", { userId, question: "how much?", answer: "$5", sourceScreenshotIds: [keptShot], createdAt: 2 }),
    }));
    const todo = await t.run((ctx) => ctx.db.insert("todos", { userId, text: "Sign up", done: false, screenshotId: id, createdAt: 1 }));

    await me.mutation(api.shots.remove, { id });
    await settle();

    expect(await t.run((ctx) => ctx.db.get(quoting))).toBeNull();
    expect(await t.run((ctx) => ctx.db.get(kept))).not.toBeNull();
    const unlinked = await t.run((ctx) => ctx.db.get(todo));
    expect(unlinked?.text).toBe("Sign up");
    expect(unlinked?.screenshotId).toBeUndefined();
    expect(await count("todos")).toBe(1);
    expect(removeDocuments).toHaveBeenCalledExactlyOnceWith(userId, [id, `chat_${quoting}_user`, `chat_${quoting}_assistant`]);
    expect(removeNamespace).not.toHaveBeenCalled();
  });

  test("another user cannot remove it", async () => {
    const { other, shot, count } = await setup();
    const id = await shot("mine");
    await expect(other.mutation(api.shots.remove, { id })).rejects.toThrow("Screenshot not found");
    expect(await count("screenshots")).toBe(1);
    expect(await count("removedAssets")).toBe(0);
  });
});

describe("uploads named by the client", () => {
  test("a duplicate import cannot delete a file that someone's screenshot uses", async () => {
    const { me, shot, otherId, upload, t } = await setup();
    await shot("asset-1");
    const theirs = await shot("theirs", otherId);
    const theirFile = (await t.run((ctx) => ctx.db.get(theirs)))!.storageId;
    await me.mutation(api.screenshots.create, { deviceAssetId: "asset-1", storageId: theirFile, takenAt: 1 });
    expect(await t.run((ctx) => ctx.storage.getUrl(theirFile))).not.toBeNull();

    // A leftover upload of the caller's own is still cleaned up.
    const spare = await upload();
    await me.mutation(api.screenshots.create, { deviceAssetId: "asset-1", storageId: spare, takenAt: 1 });
    expect(await t.run((ctx) => ctx.storage.getUrl(spare))).toBeNull();
  });
});

describe("done and reminders", () => {
  test("marking done ends the reminder and returns its id; the scheduled fire then does nothing", async () => {
    const { me, shot, t } = await setup();
    const id = await shot("flyer");
    const set = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(await me.mutation(api.shots.done, { id })).toEqual({ dismissedReminderIds: [set.reminderId] });
    await t.mutation(internal.reminders.fire, { reminderId: set.reminderId });
    expect((await t.run((ctx) => ctx.db.get(set.reminderId)))?.status).toBe("dismissed");
    expect((await me.query(api.today.get, { tzOffsetMinutes: TZ })).missed).toEqual([]);
  });

  test("marking done with no reminder returns an empty list", async () => {
    const { me, shot } = await setup();
    expect(await me.mutation(api.shots.keep, { id: await shot("idea") })).toEqual({ dismissedReminderIds: [] });
  });

  test("setting a reminder again returns the one it replaced", async () => {
    const { me, shot } = await setup();
    const id = await shot("flyer");
    const first = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(first.replacedReminderIds).toEqual([]);
    const second = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: TZ });
    expect(second.replacedReminderIds).toEqual([first.reminderId]);
    expect(second.reminderId).not.toBe(first.reminderId);
  });
});

describe("delete everything", () => {
  test("a library larger than one pass is deleted completely, files included, and nobody else's data is touched", async () => {
    const { me, shot, count, settle, t, userId, otherId } = await setup();
    const total = DELETE_BATCH * 2 + 30;
    const ids: Id<"screenshots">[] = [];
    for (let i = 0; i < total; i++) ids.push(await shot(`asset-${i}`));
    const firstFile = (await t.run((ctx) => ctx.db.get(ids[0])))!.storageId;
    await me.mutation(api.reminders.set, { screenshotId: ids[0], tzOffsetMinutes: TZ });
    let questionId: Id<"questions"> | undefined;
    await t.run(async (ctx) => {
      questionId = await ctx.db.insert("questions", { userId, question: "q", answer: "a", sourceScreenshotIds: [ids[0]], createdAt: 1 });
      await ctx.db.insert("todos", { userId, text: "do", done: false, createdAt: 1 });
      const albumId = await ctx.db.insert("albums", { userId, name: "Trips", description: "", createdAt: 1, sortStatus: "done", sortRun: 0 });
      await ctx.db.insert("albumShots", { userId, albumId, screenshotId: ids[1], source: "manual", removed: false, addedAt: 1 });
      await ctx.db.insert("dailyPicks", { userId, day: "2026-11-16", ids: [ids[0]], thin: false });
      await ctx.db.insert("removedAssets", { userId, deviceAssetId: "old", removedAt: 1 });
    });
    const theirs = await shot("theirs", otherId);
    await t.run((ctx) => ctx.db.insert("todos", { userId: otherId, text: "theirs", done: false, createdAt: 1 }));

    await me.mutation(api.shots.removeAll, {});
    // One pass deletes one batch; the rest are still there until the follow-up passes run.
    expect(await count("screenshots")).toBe(total - DELETE_BATCH);

    await settle();
    for (const table of ["screenshots", "reminders", "questions", "todos", "albums", "albumShots", "dailyPicks", "removedAssets"] as const) {
      expect([table, await count(table)]).toEqual([table, 0]);
    }
    expect(await t.run((ctx) => ctx.storage.getUrl(firstFile))).toBeNull();
    expect(removeNamespace).toHaveBeenCalledExactlyOnceWith(userId);
    // Every deleted screenshot and answer is also forgotten by id, so the delete does not depend on the one sweep above.
    const forgotten = new Set(removeDocuments.mock.calls.flatMap(([owner, docIds]) => (owner === userId ? (docIds as string[]) : [])));
    expect(ids.filter((id) => forgotten.has(id))).toHaveLength(total);
    expect([...forgotten].filter((id) => id.startsWith("chat_"))).toEqual([`chat_${questionId}_user`, `chat_${questionId}_assistant`]);

    expect(await t.run((ctx) => ctx.db.get(theirs))).not.toBeNull();
    expect(await count("todos", otherId)).toBe(1);
    expect(await t.run((ctx) => ctx.db.get(userId))).not.toBeNull();
  });

  test("a screenshot brought in after the delete started survives the later passes", async () => {
    const { me, shot, count, settle, t } = await setup();
    for (let i = 0; i < DELETE_BATCH + 5; i++) await shot(`asset-${i}`);
    await me.mutation(api.shots.removeAll, {});
    vi.advanceTimersByTime(50);
    const fresh = await shot("fresh");
    await settle();
    expect(await count("screenshots")).toBe(1);
    expect(await t.run((ctx) => ctx.db.get(fresh))).not.toBeNull();
  });

  test("to-dos written for an old screenshot after the delete began go with it; the person's own new to-do stays", async () => {
    const { me, shot, count, settle, t, userId } = await setup();
    const ids: Id<"screenshots">[] = [];
    for (let i = 0; i < DELETE_BATCH + 5; i++) ids.push(await shot(`asset-${i}`));
    await me.mutation(api.shots.removeAll, {});
    // Screenshots still waiting for the second pass. One of them is read now, which writes a to-do newer than the cutoff.
    const waiting = await t.run(async (ctx) => (await ctx.db.query("screenshots").collect()).map((r) => r._id));
    expect(waiting).toHaveLength(5);
    vi.advanceTimersByTime(50);
    const late = await t.run((ctx) => ctx.db.insert("todos", { userId, text: "From the old library", done: false, screenshotId: waiting[0], createdAt: Date.now() }));
    const own = await t.run((ctx) => ctx.db.insert("todos", { userId, text: "Typed by the person just now", done: false, createdAt: Date.now() }));
    await settle();
    expect(await count("screenshots")).toBe(0);
    expect(await t.run((ctx) => ctx.db.get(late))).toBeNull();
    expect(await t.run((ctx) => ctx.db.get(own))).not.toBeNull();
  });

  test("after a delete, a removed screenshot can be imported again", async () => {
    const { me, shot, upload, settle } = await setup();
    await me.mutation(api.shots.remove, { id: await shot("asset-1") });
    await me.mutation(api.shots.removeAll, {});
    await settle();
    expect(await me.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: ["asset-1"] })).toEqual(["asset-1"]);
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "asset-1", storageId: await upload(), takenAt: 1 })).not.toBeNull();
  });

  test("signed out, nothing is deleted", async () => {
    const { t, shot, count } = await setup();
    await shot("asset-1");
    await expect(t.mutation(api.shots.removeAll, {})).rejects.toThrow("Not signed in");
    expect(await count("screenshots")).toBe(1);
  });
});

describe("memory", () => {
  test("a failed forget is tried again until it works", async () => {
    const { me, shot, settle, userId } = await setup();
    const id = await shot("asset-1");
    removeDocuments.mockRejectedValueOnce(new Error("network")).mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
    await me.mutation(api.shots.remove, { id });
    await settle();
    expect(removeDocuments).toHaveBeenCalledTimes(3);
    expect(removeDocuments).toHaveBeenLastCalledWith(userId, [id]);
  });

  test("delete everything sweeps the whole memory once and never again, so a late retry cannot wipe what is brought in next", async () => {
    const { me, shot, settle, userId } = await setup();
    const id = await shot("asset-1");
    removeNamespace.mockRejectedValue(new Error("network"));
    await me.mutation(api.shots.removeAll, {});
    await settle();
    expect(removeNamespace).toHaveBeenCalledTimes(1);
    // The screenshot is still forgotten, by id.
    expect(removeDocuments).toHaveBeenCalledWith(userId, [id]);
  });

  test("a forget that never works stops after the last retry", async () => {
    const { me, shot, settle } = await setup();
    removeDocuments.mockRejectedValue(new Error("down"));
    await me.mutation(api.shots.remove, { id: await shot("asset-1") });
    await settle();
    expect(removeDocuments).toHaveBeenCalledTimes(FORGET_RETRY_MS.length + 1);
  });

  test("a screenshot removed while its reading was being stored is taken back out of memory", async () => {
    const { me, shot, settle, t, userId } = await setup();
    const id = await shot("asset-1");
    addMemory.mockImplementation(async () => {
      await me.mutation(api.shots.remove, { id });
    });
    await t.action(internal.memory.store, { screenshotId: id, userId, title: "t", summary: "s", text: "x", category: "money", dates: [] });
    await settle();
    // Once from remove, once from store noticing the row is gone.
    expect(removeDocuments.mock.calls).toEqual([
      [userId, [id]],
      [userId, [id]],
    ]);
  });

  test("a stored reading is flagged on a screenshot that still exists", async () => {
    const { shot, t, userId } = await setup();
    const id = await shot("asset-1");
    await t.action(internal.memory.store, { screenshotId: id, userId, title: "t", summary: "s", text: "x", category: "money", dates: [] });
    expect((await t.run((ctx) => ctx.db.get(id)))?.memoryStored).toBe(true);
    expect(removeDocuments).not.toHaveBeenCalled();
  });
});
