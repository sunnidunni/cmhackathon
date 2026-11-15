/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const calls: string[] = [];
const add = vi.fn();
const search = vi.fn();
const model = vi.fn();

vi.mock("./lib/memoryClient", () => ({
  addMemory: (...args: unknown[]) => {
    calls.push("add");
    return add(...args);
  },
  searchMemory: (...args: unknown[]) => {
    calls.push("search");
    return search(...args);
  },
}));
vi.mock("./lib/llm", () => ({
  askModel: (...args: unknown[]) => {
    calls.push("model");
    return model(...args);
  },
}));

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true }));
  const shot = (owner: typeof userId, title: string, readAt: number) =>
    t.run(async (ctx) =>
      ctx.db.insert("screenshots", {
        userId: owner,
        deviceAssetId: title,
        storageId: await ctx.storage.store(new Blob(["x"])),
        takenAt: readAt,
        status: "ready",
        title,
        summary: `${title} summary`,
        readAt,
      }),
    );
  return { t, userId, otherId, shot, me: t.withIdentity({ subject: `${userId}|s` }) };
}

beforeEach(() => {
  calls.length = 0;
  add.mockReset().mockResolvedValue(undefined);
  search.mockReset().mockResolvedValue([]);
  model.mockReset();
});

describe("ask", () => {
  test("searches memory before the model, and adds both turns under the user id", async () => {
    const { me, userId, shot } = await setup();
    const bill = await shot(userId, "Power bill", 10);
    search.mockResolvedValue([{ text: "Power bill due Nov 16", screenshotId: bill, kind: "screenshot" }]);
    model.mockResolvedValue({ found: true, answer: "It is due Nov 16.", sourceIds: [bill] });

    const res = await me.action(api.ask.ask, { question: "When is that due?" });

    expect(calls.slice(0, 2)).toEqual(["search", "model"]);
    expect(search.mock.calls[0][0]).toBe(userId);
    expect(res).toMatchObject({ answer: "It is due Nov 16.", found: true });
    expect(res.sources.map((s) => s.screenshotId)).toEqual([bill]);
    expect(add).toHaveBeenCalledTimes(2);
    for (const [ns, doc] of add.mock.calls) {
      expect(ns).toBe(userId);
      expect(doc.metadata).toMatchObject({ kind: "chat", questionId: res.questionId });
    }
    expect(add.mock.calls.map(([, d]) => d.metadata.role).sort()).toEqual(["assistant", "user"]);
    const history = await me.query(api.ask.history, {});
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ question: "When is that due?", found: true });
  });

  test("puts the three most recently read screenshots in the model context", async () => {
    const { me, userId, shot } = await setup();
    for (const [i, name] of ["a", "b", "c", "d"].entries()) await shot(userId, name, i);
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await me.action(api.ask.ask, { question: "q" });
    const prompt: string = model.mock.calls[0][1];
    const recent = prompt.slice(0, prompt.indexOf("All the user's"));
    expect(recent.indexOf("d.")).toBeLessThan(recent.indexOf("c."));
    expect(recent).toContain("b.");
    expect(recent).not.toContain("[id " + "a");
  });

  test("another user's screenshot never comes back as a source", async () => {
    const { me, userId, otherId, shot } = await setup();
    const mine = await shot(userId, "mine", 1);
    const theirs = await shot(otherId, "theirs", 2);
    search.mockResolvedValue([{ text: "x", screenshotId: theirs, kind: "screenshot" }]);
    model.mockResolvedValue({ found: true, answer: "ok", sourceIds: [theirs, mine, "bogus"] });
    const res = await me.action(api.ask.ask, { question: "q" });
    expect(res.sources.map((s) => s.screenshotId)).toEqual([mine]);

    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    const miss = await me.action(api.ask.ask, { question: "q2" });
    expect(miss.sources.map((s) => s.screenshotId)).not.toContain(theirs);
  });

  test("not found returns the exact sentence and at most three sources", async () => {
    const { me, userId, shot } = await setup();
    for (let i = 0; i < 5; i++) await shot(userId, `s${i}`, i);
    model.mockResolvedValue({ found: false, answer: "made up", sourceIds: [] });
    const res = await me.action(api.ask.ask, { question: "q" });
    expect(res.found).toBe(false);
    expect(res.answer).toBe("I couldn't find that in your screenshots.");
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.sources.length).toBeLessThanOrEqual(3);
  });

  test("a Supermemory failure still answers from the library fallback", async () => {
    const { me, userId, shot } = await setup();
    const bill = await shot(userId, "Power bill", 5);
    search.mockRejectedValue(new Error("down"));
    add.mockRejectedValue(new Error("down"));
    model.mockResolvedValue({ found: true, answer: "Nov 16.", sourceIds: [bill] });
    const res = await me.action(api.ask.ask, { question: "when?" });
    expect(res.answer).toBe("Nov 16.");
    expect(model.mock.calls[0][1]).toContain("All the user's screenshots");
    expect(model.mock.calls[0][1]).toContain("Power bill");
  });
});

describe("the Expo app", () => {
  test("no file under src/ imports supermemory", () => {
    const files = import.meta.glob("../src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });
    expect(Object.keys(files).length).toBeGreaterThan(0);
    for (const [path, source] of Object.entries(files)) {
      expect(source as string, path).not.toMatch(/supermemory/i);
    }
  });
});
