/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true, plan: "free" }),
  );
  const otherId = await t.run((ctx) =>
    ctx.db.insert("users", { isAnonymous: true, plan: "free" }),
  );
  const storeBlob = () => t.run((ctx) => ctx.storage.store(new Blob(["img"])));
  // The caller's screenshots as the app pages through them once read, newest first.
  const rowsOf = (owner: typeof userId) => t.run(async (ctx) => (await ctx.db.query("screenshots").collect()).filter((r) => r.userId === owner));
  return {
    t,
    userId,
    otherId,
    rowsOf,
    storeBlob,
    me: t.withIdentity({ subject: `${userId}|session1` }),
    other: t.withIdentity({ subject: `${otherId}|session2` }),
  };
}

describe("screenshots", () => {
  test("create stores an uploaded row owned by the caller", async () => {
    const { me, storeBlob, userId, t, rowsOf } = await setup();
    const storageId = await storeBlob();
    const id = await me.mutation(api.screenshots.create, {
      deviceAssetId: "asset-1",
      storageId,
      takenAt: 1000,
    });
    const row = await t.run((ctx) => ctx.db.get(id!));
    expect(row).toMatchObject({ userId, status: "uploaded", deviceAssetId: "asset-1", storageId });
    expect(await rowsOf(userId)).toHaveLength(1);
    expect(await t.run((ctx) => ctx.storage.getUrl(storageId))).toBeTypeOf("string");
  });

  test("a known deviceAssetId is skipped and not uploaded twice", async () => {
    const { me, storeBlob, rowsOf, userId } = await setup();
    const first = await me.mutation(api.screenshots.create, {
      deviceAssetId: "asset-1",
      storageId: await storeBlob(),
      takenAt: 1000,
    });
    expect(
      await me.query(api.screenshots.unknownDeviceAssetIds, {
        deviceAssetIds: ["asset-1", "asset-2"],
      }),
    ).toEqual(["asset-2"]);
    const second = await me.mutation(api.screenshots.create, {
      deviceAssetId: "asset-1",
      storageId: await storeBlob(),
      takenAt: 1000,
    });
    expect(second).toEqual(first);
    expect(await rowsOf(userId)).toHaveLength(1);
  });

  test("users only see their own screenshots", async () => {
    const { me, other, storeBlob, rowsOf, otherId } = await setup();
    await me.mutation(api.screenshots.create, {
      deviceAssetId: "asset-1",
      storageId: await storeBlob(),
      takenAt: 1000,
    });
    expect(await rowsOf(otherId)).toHaveLength(0);
    expect((await other.query(api.sync.progress, {})).total).toBe(0);
    expect(
      await other.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: ["asset-1"] }),
    ).toEqual(["asset-1"]);
  });

  test("signed-out callers are rejected", async () => {
    const { t } = await setup();
    await expect(t.mutation(api.screenshots.generateUploadUrl, {})).rejects.toThrow("Not signed in");
    await expect(t.query(api.screenshots.unknownDeviceAssetIds, { deviceAssetIds: ["a"] })).rejects.toThrow("Not signed in");
  });

  test("repeating create with the same storageId keeps the row's own image", async () => {
    const { me, storeBlob, t } = await setup();
    const storageId = await storeBlob();
    const id = await me.mutation(api.screenshots.create, { deviceAssetId: "dup", storageId, takenAt: 1 });
    const again = await me.mutation(api.screenshots.create, { deviceAssetId: "dup", storageId, takenAt: 1 });
    expect(again).toBe(id);
    expect(await t.run((ctx) => ctx.storage.getUrl(storageId))).not.toBeNull();
  });

  test("a duplicate create deletes only its own distinct, unreferenced upload", async () => {
    const { me, storeBlob, t } = await setup();
    const first = await storeBlob();
    await me.mutation(api.screenshots.create, { deviceAssetId: "dup", storageId: first, takenAt: 1 });
    const extra = await storeBlob();
    await me.mutation(api.screenshots.create, { deviceAssetId: "dup", storageId: extra, takenAt: 1 });
    expect(await t.run((ctx) => ctx.storage.getUrl(extra))).toBeNull();
    expect(await t.run((ctx) => ctx.storage.getUrl(first))).not.toBeNull();
    const other = await storeBlob();
    await me.mutation(api.screenshots.create, { deviceAssetId: "other", storageId: other, takenAt: 2 });
    await me.mutation(api.screenshots.create, { deviceAssetId: "dup", storageId: other, takenAt: 1 });
    expect(await t.run((ctx) => ctx.storage.getUrl(other))).not.toBeNull();
  });
});
