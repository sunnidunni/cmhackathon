/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { MAX_ATTEMPTS, MAX_PARALLEL, MAX_RATE_LIMITS } from "./extract";
import { FREE_DAILY_IMPORTS, countImport } from "./lib/importPlan";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));

const modules = import.meta.glob("./**/*.ts");
const LA = "America/Los_Angeles";

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function setup(user: Record<string, unknown> = {}) {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true, plan: "free", ...user }));
  const shot = (deviceAssetId: string, extra: Record<string, unknown> = {}, owner: Id<"users"> = userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", { userId: owner, deviceAssetId, storageId: await ctx.storage.store(new Blob(["x"])), takenAt: 1000, status: "uploaded", ...extra }),
    );
  const upload = () => t.run((ctx) => ctx.storage.store(new Blob(["x"])));
  const get = (id: Id<"screenshots">) => t.run((ctx) => ctx.db.get(id));
  return { t, userId, shot, upload, get, me: t.withIdentity({ subject: `${userId}|s` }) };
}

const reply = { title: "Bill", amount: "", text: "t", summary: "s", category: "money", reason: "r", todos: [], dates: [], importance: 3, reactionKey: "money_01", albums: [] };

describe("OpenAI saying slow down, or out of credit", () => {
  const runWith = async (body: string) => {
    const s = await setup();
    const id = await s.shot("a", { status: "processing", startedAt: Date.now() });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 429 })));
    await s.t.action(internal.extract.run, { screenshotId: id });
    return { ...s, id };
  };

  test("out of credit counts as a failed attempt, so the screenshot ends up failed instead of going round forever", async () => {
    const { t, id, get } = await runWith('{"error":{"code":"insufficient_quota","type":"insufficient_quota"}}');
    expect(await get(id)).toMatchObject({ status: "uploaded", attempts: 1 });
    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      await t.run((ctx) => ctx.db.patch(id, { status: "processing", startedAt: Date.now() }));
      await t.action(internal.extract.run, { screenshotId: id });
    }
    const row = await get(id);
    expect(row).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS });
    expect(row?.error).toContain("insufficient_quota");
  });

  test("slow down waits without using up an attempt, but only so many times", async () => {
    const { t, id, get } = await runWith('{"error":{"code":"rate_limit_exceeded"}}');
    expect(await get(id)).toMatchObject({ status: "uploaded", rateLimits: 1 });
    expect((await get(id))?.attempts ?? 0).toBe(0);
    for (let n = 2; n < MAX_RATE_LIMITS; n++) {
      await t.run((ctx) => ctx.db.patch(id, { status: "processing", startedAt: Date.now() }));
      await t.mutation(internal.extract.fail, { screenshotId: id, error: "OpenAI 429: slow down", rateLimited: true });
      expect((await get(id))?.status).toBe("uploaded");
    }
    await t.run((ctx) => ctx.db.patch(id, { status: "processing", startedAt: Date.now() }));
    await t.mutation(internal.extract.fail, { screenshotId: id, error: "OpenAI 429: slow down", rateLimited: true });
    expect(await get(id)).toMatchObject({ status: "failed", rateLimits: MAX_RATE_LIMITS });
  });

  test("trying a failed screenshot again starts both counts from zero", async () => {
    const { me, shot, get } = await setup();
    const id = await shot("a", { status: "failed", attempts: 3, rateLimits: 30, error: "x" });
    await me.mutation(api.extract.retry, { screenshotId: id });
    const row = await get(id);
    expect([row?.attempts, row?.rateLimits]).toEqual([0, 0]);
    expect(["uploaded", "processing"]).toContain(row?.status);
  });
});

describe("the reading queue", () => {
  test("someone with a few new screenshots is not stuck behind another person's long line", async () => {
    const { t, shot, get } = await setup();
    const other = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
    for (let i = 0; i < 260; i++) await shot(`big-${i}`);
    const mine = [await shot("mine-1", {}, other), await shot("mine-2", {}, other), await shot("mine-3", {}, other)];
    await t.mutation(internal.extract.kick, {});
    const statuses = await Promise.all(mine.map(async (id) => (await get(id))?.status));
    expect(statuses).toEqual(["processing", "processing", "processing"]);
    const all = await t.run((ctx) => ctx.db.query("screenshots").collect());
    expect(all.filter((r) => r.status === "processing")).toHaveLength(MAX_PARALLEL);
  });
});

describe("what the reading model is told about dates", () => {
  test("today and the day the screenshot was taken are the person's calendar days", async () => {
    vi.useFakeTimers();
    // 03:00 UTC on Nov 16 is still Nov 15 in Los Angeles and already Nov 16 in Tokyo.
    vi.setSystemTime(Date.UTC(2026, 10, 16, 3, 0));
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify({ output_text: JSON.stringify(reply) })));
    vi.stubGlobal("fetch", fetchMock);
    const prompt = async (timeZone: string | undefined) => {
      const { t, shot } = await setup(timeZone ? { timeZone } : {});
      const id = await shot("a", { status: "processing", startedAt: Date.now(), takenAt: Date.UTC(2026, 8, 1, 4, 0) });
      await t.action(internal.extract.run, { screenshotId: id });
      const body = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body as string);
      return body.input[0].content[0].text as string;
    };
    const la = await prompt(LA);
    expect(la).toContain("Today's date is 2026-11-15. The screenshot was taken on 2026-08-31.");
    expect(la).toContain("counted from the day the screenshot was taken, and always has confident set to false");
    const tokyo = await prompt("Asia/Tokyo");
    expect(tokyo).toContain("Today's date is 2026-11-16. The screenshot was taken on 2026-09-01.");
    // Nobody has opened the app yet, so the zone is unknown: UTC, not somebody else's city.
    expect(await prompt(undefined)).toContain("Today's date is 2026-11-16. The screenshot was taken on 2026-09-01.");
  });
});

describe("the phone's time zone", () => {
  test("opening the app stores a real zone name and ignores a made-up one", async () => {
    const { me, t, userId } = await setup();
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: 480, timeZone: LA });
    expect((await t.run((ctx) => ctx.db.get(userId)))?.timeZone).toBe(LA);
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: 480, timeZone: "Mars/Olympus" });
    expect((await t.run((ctx) => ctx.db.get(userId)))?.timeZone).toBe(LA);
    // An older app sends no zone at all.
    await me.mutation(api.today.appOpened, { tzOffsetMinutes: 480 });
    expect((await t.run((ctx) => ctx.db.get(userId)))?.timeZone).toBe(LA);
  });

  test("a reminder set before a clock change is due at 9:00 local the day before", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2027, 2, 1, 20, 0));
    const { me, shot } = await setup();
    const id = await shot("flyer", { status: "ready", title: "Fair", dates: [{ when: "2027-03-20T19:00", what: "event", confident: true }] });
    const r = await me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: 480, timeZone: LA });
    expect(r.dueAt).toBe(Date.UTC(2027, 2, 19, 16, 0));
  });

  test("a reminder cannot be set for a date that has passed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 10, 16, 20, 0));
    const { me, shot } = await setup();
    const id = await shot("old", { status: "ready", title: "Old", dates: [{ when: "2026-11-10T19:00", what: "event", confident: true }] });
    await expect(me.mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: 480, when: "2026-11-10T19:00" })).rejects.toThrow("That date has passed");
  });
});

describe("the free plan's daily allowance", () => {
  test("counts imports, stops at the allowance, and starts again a day later", () => {
    const start = 1_000_000;
    let counter: { importWindowStart?: number; importCount?: number } = {};
    for (let i = 0; i < FREE_DAILY_IMPORTS; i++) {
      const { allowed, ...next } = countImport(counter, start + i);
      expect(allowed).toBe(true);
      counter = next;
    }
    expect(counter).toEqual({ importWindowStart: start, importCount: FREE_DAILY_IMPORTS });
    expect(countImport(counter, start + 23 * 3600 * 1000).allowed).toBe(false);
    expect(countImport(counter, start + 24 * 3600 * 1000)).toEqual({ allowed: true, importWindowStart: start + 24 * 3600 * 1000, importCount: 1 });
  });

  test("a free user over the allowance imports nothing and the upload is discarded; a paid user is not limited", async () => {
    const { me, upload, t, userId } = await setup({ importWindowStart: Date.now(), importCount: FREE_DAILY_IMPORTS - 1 });
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "last-allowed", storageId: await upload(), takenAt: 1 })).not.toBeNull();
    const spare = await upload();
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "one-too-many", storageId: spare, takenAt: 1 })).toBeNull();
    expect(await t.run((ctx) => ctx.storage.getUrl(spare))).toBeNull();
    expect(await t.run(async (ctx) => (await ctx.db.query("screenshots").collect()).length)).toBe(1);

    await t.run((ctx) => ctx.db.patch(userId, { plan: "paid" }));
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "paid-now", storageId: await upload(), takenAt: 1 })).not.toBeNull();
  });

  test("importing the same screenshot twice counts once", async () => {
    const { me, upload, t, userId } = await setup();
    await me.mutation(api.screenshots.create, { deviceAssetId: "a", storageId: await upload(), takenAt: 1 });
    await me.mutation(api.screenshots.create, { deviceAssetId: "a", storageId: await upload(), takenAt: 1 });
    expect((await t.run((ctx) => ctx.db.get(userId)))?.importCount).toBe(1);
  });

  test("DEV_UNLIMITED_IMPORT lifts the allowance", async () => {
    vi.stubEnv("DEV_UNLIMITED_IMPORT", "1");
    const { me, upload } = await setup({ importWindowStart: Date.now(), importCount: FREE_DAILY_IMPORTS });
    expect(await me.mutation(api.screenshots.create, { deviceAssetId: "a", storageId: await upload(), takenAt: 1 })).not.toBeNull();
  });
});

describe("screenshot detail", () => {
  test("does not hand the raw reading error to the app", async () => {
    const { me, shot } = await setup();
    const id = await shot("a", { status: "failed", error: 'OpenAI 500: {"internal":"details"}' });
    const detail = await me.query(api.shots.detail, { id });
    expect(detail).toMatchObject({ status: "failed" });
    expect(JSON.stringify(detail)).not.toContain("internal");
  });
});
