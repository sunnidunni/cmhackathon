/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("notes", () => {
  test("lists only the caller's read, visible screenshots, newest first, with confident dates", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
    const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
    const seed = (owner: typeof userId, title: string, extra: Record<string, unknown> = {}) =>
      t.run(async (ctx) =>
        ctx.db.insert("screenshots", {
          userId: owner,
          deviceAssetId: title,
          storageId: await ctx.storage.store(new Blob(["x"])),
          takenAt: 1000,
          status: "ready",
          title,
          summary: `${title} summary`,
          category: "money",
          ...extra,
        }),
      );
    await seed(userId, "bill", {
      takenAt: 2000,
      amount: "$48.20",
      dates: [
        { when: "2026-11-20", what: "Due", confident: true },
        { when: "2026-11-21", what: "Maybe", confident: false },
      ],
    });
    await seed(userId, "flyer", { takenAt: 3000, category: "deadlines" });
    await seed(userId, "pending", { status: "processing" });
    await seed(userId, "hidden", { hidden: true });
    await seed(otherId, "theirs");

    const notes = await t.withIdentity({ subject: `${userId}|s` }).query(api.notes.list, {});
    expect(notes.map((n) => n.title)).toEqual(["flyer", "bill"]);
    expect(notes[1]).toMatchObject({ summary: "bill summary", category: "money", amount: "$48.20", dates: [{ when: "2026-11-20", what: "Due" }] });
    expect(notes[1].imageUrl).toBeTruthy();
  });
});
