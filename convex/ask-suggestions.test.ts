/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: vi.fn(), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));
vi.mock("./lib/llm", () => ({ askModel: vi.fn(), todosFromText: vi.fn() }));
const modules = import.meta.glob("./**/*.ts");

describe("ask.suggestions only offers what the answer path can see", () => {
  test("every chip points at a screenshot in the ask library (newest 50 ready)", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", {}));
    const ids: string[] = [];
    for (let i = 0; i < 60; i++) {
      ids.push(
        await t.run(async (ctx) =>
          ctx.db.insert("screenshots", {
            userId,
            deviceAssetId: String(i),
            storageId: await ctx.storage.store(new Blob(["x"])),
            takenAt: i,
            status: "ready",
            title: `Thing ${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`,
            importance: i < 10 ? 5 : 1,
            dates: [{ when: "2026-12-01", what: "due", confident: true }],
          }),
        ),
      );
    }
    const me = t.withIdentity({ subject: `${userId}|s` });
    const chips = await me.query(api.ask.suggestions, {});
    const { library } = await t.query(internal.askData.context, { userId });
    const visible = new Set(library.map((b: { id: string }) => b.id));
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) expect(visible.has(c.screenshotId)).toBe(true);
  });
});
