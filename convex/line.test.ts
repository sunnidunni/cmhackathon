/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { lineText } from "./lib/lineText";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeMemory: vi.fn() }));
const modules = import.meta.glob("./**/*.ts");

const fetchMock = vi.fn();
const ENV = { TELEGRAM_BOT_TOKEN: "TOKEN_X", LINE_TELEGRAM_CHAT_ID: "4242" };

async function setup(over: object = {}) {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", {}));
  const otherId = await t.run((ctx) => ctx.db.insert("users", {}));
  const shot = (owner: typeof userId) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId: Math.random().toString(),
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: 1,
        status: "ready",
        title: "Brightside Power bill",
        category: "money",
        amount: "$142.37",
        dates: [{ when: "2099-11-20", what: "Payment due", confident: true }],
        ...over,
      }),
    );
  return { t, userId, otherId, shot, me: (id: typeof userId) => t.withIdentity({ subject: `${id}|s` }) };
}
const useEnv = (userId: string | null, env: Record<string, string> = ENV) => {
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  if (userId) process.env.LINE_USER_ID = userId;
};

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const k of ["TELEGRAM_BOT_TOKEN", "LINE_TELEGRAM_CHAT_ID", "LINE_USER_ID"]) delete process.env[k];
});
const drain = (t: ReturnType<typeof convexTest>) => t.finishAllScheduledFunctions(vi.runAllTimers);

describe("line text", () => {
  test("built only from stored fields", () => {
    expect(lineText({ title: "Brightside Power bill", whenKey: "2099-11-20", amount: "$142.37" })).toBe("Psst. Brightside Power bill is Fri, Nov 20. $142.37.");
    expect(lineText({ title: "Harvest Lantern Night", whenKey: "2099-11-16T18:30" })).toBe("Psst. Harvest Lantern Night is Mon, Nov 16 at 6:30 PM.");
  });
  test("no confident date means no date in the text", () => {
    expect(lineText({ title: "Drift Pro headphones", whenKey: undefined })).toBe("Psst. You asked me to remind you about Drift Pro headphones.");
  });
});

describe("reminders reach the line", () => {
  test("fireNow sends exactly one Telegram message for the allowed user", async () => {
    const { t, userId, shot, me } = await setup();
    useEnv(userId);
    const id = await shot(userId);
    await me(userId).mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: 0 });
    await drain(t);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.telegram.org/botTOKEN_X/sendMessage");
    expect(JSON.parse(init.body)).toEqual({ chat_id: "4242", text: "Psst. Brightside Power bill is Fri, Nov 20. $142.37." });
  });

  test("a scheduled reminder sends once when it comes due", async () => {
    const { t, userId, shot, me } = await setup();
    useEnv(userId);
    const id = await shot(userId);
    await me(userId).mutation(api.reminders.set, { screenshotId: id, tzOffsetMinutes: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    await drain(t);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("another user's reminder never reaches the line", async () => {
    const { t, userId, otherId, shot, me } = await setup();
    useEnv(userId);
    const id = await shot(otherId);
    await me(otherId).mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: 0 });
    await drain(t);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("with any setting missing nothing is sent and the reminder still fires", async () => {
    const { t, userId, shot, me } = await setup();
    const id = await shot(userId);
    for (const missing of ["LINE_USER_ID", "TELEGRAM_BOT_TOKEN", "LINE_TELEGRAM_CHAT_ID"]) {
      useEnv(userId);
      delete process.env[missing];
      const res = await me(userId).mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: 0 });
      await drain(t);
      expect(res.text).toContain("Psst");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a failed send never fails the reminder and never logs the token", async () => {
    const { t, userId, shot, me } = await setup();
    useEnv(userId);
    fetchMock.mockRejectedValue(new Error("network down https://api.telegram.org/botTOKEN_X/sendMessage"));
    const logs = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const id = await shot(userId);
    const res = await me(userId).mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: 0 });
    await drain(t);
    expect(res.text).toContain("Psst");
    expect(JSON.stringify(logs.mock.calls)).not.toContain("TOKEN_X");
    expect((await t.run((ctx) => ctx.db.query("reminders").collect()))[0].status).toBe("sent");
    logs.mockRestore();
  });

  test("a non-2xx answer is swallowed too", async () => {
    const { t, userId, shot, me } = await setup();
    useEnv(userId);
    fetchMock.mockResolvedValue(new Response("nope", { status: 400 }));
    const id = await shot(userId);
    await me(userId).mutation(api.reminders.fireNow, { screenshotId: id, tzOffsetMinutes: 0 });
    await drain(t);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
