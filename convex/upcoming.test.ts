/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));

const modules = import.meta.glob("./**/*.ts");
const TZ = 480;
const inDays = (n: number) => new Date(Date.now() - TZ * 60000 + n * 86400000).toISOString().slice(0, 10) + "T18:30";

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const shot = (title: string, days: number, owner: Id<"users"> = userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", { userId: owner, deviceAssetId: title, storageId: await ctx.storage.store(new Blob(["x"])), takenAt: 1, status: "ready", title, category: "deadlines", dates: [{ when: inDays(days), what: "event", confident: true }] }),
    );
  const as = (id: Id<"users">) => t.withIdentity({ subject: `${id}|s` });
  return { t, userId, otherId, shot, me: as(userId), other: as(otherId) };
}

test("upcoming lists the person's scheduled reminders, soonest first, with what the phone needs to notify", async () => {
  const { me, shot } = await setup();
  const later = await shot("Later", 9);
  const sooner = await shot("Sooner", 3);
  const a = await me.mutation(api.reminders.set, { screenshotId: later, tzOffsetMinutes: TZ });
  const b = await me.mutation(api.reminders.set, { screenshotId: sooner, tzOffsetMinutes: TZ });
  const list = await me.query(api.reminders.upcoming, { after: Date.now() });
  expect(list).toEqual([
    { reminderId: b.reminderId, screenshotId: sooner, dueAt: b.dueAt, text: b.text },
    { reminderId: a.reminderId, screenshotId: later, dueAt: a.dueAt, text: a.text },
  ]);
});

test("upcoming leaves out reminders that were turned off, replaced, already sent, done, or due before the given time", async () => {
  const { me, shot, t } = await setup();
  const off = await me.mutation(api.reminders.set, { screenshotId: await shot("Off", 3), tzOffsetMinutes: TZ });
  await me.mutation(api.reminders.cancel, { reminderId: off.reminderId });
  const replacedShot = await shot("Replaced", 4);
  await me.mutation(api.reminders.set, { screenshotId: replacedShot, tzOffsetMinutes: TZ });
  const current = await me.mutation(api.reminders.set, { screenshotId: replacedShot, tzOffsetMinutes: TZ });
  const sent = await me.mutation(api.reminders.set, { screenshotId: await shot("Sent", 5), tzOffsetMinutes: TZ });
  await t.mutation(internal.reminders.fire, { reminderId: sent.reminderId });
  const doneShot = await shot("Done", 6);
  await me.mutation(api.reminders.set, { screenshotId: doneShot, tzOffsetMinutes: TZ });
  await me.mutation(api.shots.done, { id: doneShot });

  expect((await me.query(api.reminders.upcoming, { after: Date.now() })).map((r) => r.reminderId)).toEqual([current.reminderId]);
  expect(await me.query(api.reminders.upcoming, { after: current.dueAt })).toEqual([]);
});

test("upcoming never includes another person's reminders, and needs a signed-in user", async () => {
  const { me, other, otherId, shot, t } = await setup();
  await other.mutation(api.reminders.set, { screenshotId: await shot("Theirs", 3, otherId), tzOffsetMinutes: TZ });
  expect(await me.query(api.reminders.upcoming, { after: 0 })).toEqual([]);
  await expect(t.query(api.reminders.upcoming, { after: 0 })).rejects.toThrow("Not signed in");
});

test("hundreds of turned-off reminders with future dates do not hide a live one", async () => {
  const { me, shot, t, userId } = await setup();
  const live = await me.mutation(api.reminders.set, { screenshotId: await shot("Live", 20), tzOffsetMinutes: TZ });
  const anyShot = await shot("Old", 5);
  // 320 dismissed reminders, all due before the live one: more than the query's limit.
  await t.run(async (ctx) => {
    for (let i = 0; i < 320; i++) await ctx.db.insert("reminders", { userId, screenshotId: anyShot, dueAt: Date.now() + 60_000 + i, message: "x", status: "dismissed" });
  });
  expect((await me.query(api.reminders.upcoming, { after: Date.now() })).map((r) => r.reminderId)).toEqual([live.reminderId]);
});
