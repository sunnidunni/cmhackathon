/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { MAX_PARALLEL } from "./extract";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup(n = 1) {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true, plan: "free" }));
  const ids = await t.run(async (ctx) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const storageId = await ctx.storage.store(new Blob(["img"]));
      out.push(
        await ctx.db.insert("screenshots", {
          userId,
          deviceAssetId: `a${i}`,
          storageId,
          takenAt: 1000 - i,
          status: "uploaded",
        }),
      );
    }
    return out;
  });
  return { t, userId, ids, me: t.withIdentity({ subject: `${userId}|s` }) };
}

const result = {
  title: "Bill",
  text: "t",
  summary: "s",
  category: "money" as const,
  reason: "r",
  dates: [],
  importance: 5,
  reactionKey: "money_01",
};
const status = (t: Awaited<ReturnType<typeof setup>>["t"], id: Id<"screenshots">) =>
  t.run(async (ctx) => (await ctx.db.get(id))?.status);

describe("status transitions", () => {
  test("kick moves at most MAX_PARALLEL uploaded rows to processing", async () => {
    const { t, ids } = await setup(MAX_PARALLEL + 2);
    await t.mutation(internal.extract.kick, {});
    const statuses = await Promise.all(ids.map((id) => status(t, id)));
    expect(statuses.filter((s) => s === "processing")).toHaveLength(MAX_PARALLEL);
    expect(statuses.filter((s) => s === "uploaded")).toHaveLength(2);
    expect(MAX_PARALLEL).toBe(10);
  });

  test("complete makes a processing row ready, and ignores a row that is not processing", async () => {
    const { t, ids } = await setup();
    expect(await t.mutation(internal.extract.complete, { screenshotId: ids[0], ...result })).toBe(false);
    await t.mutation(internal.extract.kick, {});
    expect(await t.mutation(internal.extract.complete, { screenshotId: ids[0], ...result })).toBe(true);
    const row = await t.run((ctx) => ctx.db.get(ids[0]));
    expect(row).toMatchObject({ status: "ready", title: "Bill", category: "money", importance: 5 });
  });

  test("a user move survives extraction", async () => {
    const { t, ids } = await setup();
    await t.run((ctx) => ctx.db.patch(ids[0], { category: "ideas", userMoved: true }));
    await t.mutation(internal.extract.kick, {});
    await t.mutation(internal.extract.complete, { screenshotId: ids[0], ...result });
    expect((await t.run((ctx) => ctx.db.get(ids[0])))?.category).toBe("ideas");
  });

  test("fail retries twice then becomes failed, and retry brings it back", async () => {
    const { t, ids, me } = await setup();
    for (let i = 0; i < 3; i++) {
      await t.run((ctx) => ctx.db.patch(ids[0], { status: "processing", startedAt: Date.now(), retryAt: undefined }));
      await t.mutation(internal.extract.fail, { screenshotId: ids[0], error: "boom" });
      expect(await status(t, ids[0])).toBe(i < 2 ? "uploaded" : "failed");
    }
    await me.mutation(api.extract.retry, { screenshotId: ids[0] });
    expect(await status(t, ids[0])).toBe("uploaded");
  });

  test("progress counts ready rows out of all rows", async () => {
    const { t, ids, me } = await setup(3);
    await t.run((ctx) => ctx.db.patch(ids[0], { status: "processing" }));
    await t.mutation(internal.extract.complete, { screenshotId: ids[0], ...result });
    expect(await me.query(api.sync.progress, {})).toEqual({ total: 3, read: 1, failed: 0, pending: 2, uploaded: 3 });
  });
});

describe("timeout recovery", () => {
  test("claiming a row schedules a recovery kick after the stale window", async () => {
    const { t, ids } = await setup();
    await t.mutation(internal.extract.kick, {});
    const jobs = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
    const recovery = jobs.filter(
      (j) => j.name === "extract:kick" && j.scheduledTime > Date.now() + 2 * 60 * 1000,
    );
    expect(recovery.length).toBeGreaterThan(0);
    expect(ids).toHaveLength(1);
  });

  test("a row stuck in processing is retried by the next kick, then failed after three tries", async () => {
    const { t, ids } = await setup();
    await t.run((ctx) => ctx.db.patch(ids[0], { status: "processing", startedAt: Date.now() - 10 * 60 * 1000 }));
    await t.mutation(internal.extract.kick, {});
    expect((await t.run((ctx) => ctx.db.get(ids[0])))?.status).toBe("uploaded");
    await t.run((ctx) => ctx.db.patch(ids[0], { status: "processing", startedAt: Date.now() - 10 * 60 * 1000, attempts: 2 }));
    await t.mutation(internal.extract.kick, {});
    expect((await t.run((ctx) => ctx.db.get(ids[0])))?.status).toBe("failed");
  });
});

describe("rate limits", () => {
  test("an OpenAI 429 retries without using up attempts", async () => {
    const { t, ids } = await setup();
    for (let i = 0; i < 6; i++) {
      await t.run((ctx) => ctx.db.patch(ids[0], { status: "processing", startedAt: Date.now(), retryAt: undefined }));
      await t.mutation(internal.extract.fail, { screenshotId: ids[0], error: "OpenAI 429: rate limit", rateLimited: true });
      const row = await t.run((ctx) => ctx.db.get(ids[0]));
      expect(row?.status).toBe("uploaded");
      expect(row?.attempts ?? 0).toBe(0);
    }
  });
});
