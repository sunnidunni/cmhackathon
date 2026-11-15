/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const add = vi.fn();
vi.mock("./lib/memoryClient", () => ({
  addMemory: (...args: unknown[]) => add(...args),
  searchMemory: vi.fn(),
}));

const modules = import.meta.glob("./**/*.ts");
afterEach(() => vi.unstubAllGlobals());

const reply = {
  title: "Bill",
  text: "Due Nov 16",
  summary: "A bill",
  category: "money",
  reason: "r",
  dates: [{ when: "2026-11-16", what: "due", confident: true }],
  importance: 5,
  reactionKey: "money_02",
};

test("a read screenshot is stored in memory under the user id and flagged", async () => {
  add.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ output_text: JSON.stringify(reply) }))),
  );
  const t = convexTest(schema, modules);
  const { userId, id } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const id = await ctx.db.insert("screenshots", {
      userId,
      deviceAssetId: "a",
      storageId: await ctx.storage.store(new Blob(["x"])),
      takenAt: 1,
      status: "processing",
      startedAt: Date.now(),
    });
    return { userId, id };
  });
  await t.action(internal.extract.run, { screenshotId: id });
  const row = await t.run((ctx) => ctx.db.get(id));
  expect(row).toMatchObject({ status: "ready", reactionKey: "money_02", memoryStored: true });
  expect(add).toHaveBeenCalledTimes(1);
  expect(add.mock.calls[0][0]).toBe(userId);
  expect(add.mock.calls[0][1]).toMatchObject({ id, metadata: { screenshotId: id, kind: "screenshot" } });
});
