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

describe("what the answering model is given", () => {
  test("the library is always listed; with search results it is listed without each screenshot's full text", async () => {
    const { me, userId, shot, t } = await setup();
    const bill = await shot(userId, "Power bill", 5);
    const flyer = await shot(userId, "Pottery flyer", 6);
    await t.run(async (ctx) => {
      await ctx.db.patch(bill, { text: "FULL BILL TEXT" });
      await ctx.db.patch(flyer, { text: "FULL FLYER TEXT" });
    });
    // Four screenshots read later, so neither of the two above is among the three most recent.
    for (let i = 0; i < 4; i++) await shot(userId, `later ${i}`, 10 + i);
    search.mockResolvedValue([{ text: "Power bill due Nov 16", screenshotId: bill, kind: "screenshot" }]);
    model.mockResolvedValue({ found: true, answer: "ok", sourceIds: [flyer] });
    const res = await me.action(api.ask.ask, { question: "when is pottery?" });

    const prompt: string = model.mock.calls[0][1];
    const library = prompt.slice(prompt.indexOf("All the user's screenshots"));
    expect(prompt).toContain("Memory search results:\n[id " + bill + "] Power bill due Nov 16");
    // The search missed the flyer, but it is still in front of the model and can be cited.
    expect(library).toContain("[id " + flyer + "] Pottery flyer.");
    expect(library).not.toContain("FULL FLYER TEXT");
    expect(res.sources.map((s) => s.screenshotId)).toEqual([flyer]);
  });

  test("with no search results the library carries the full text", async () => {
    const { me, userId, shot, t } = await setup();
    const bill = await shot(userId, "Power bill", 5);
    await t.run((ctx) => ctx.db.patch(bill, { text: "FULL BILL TEXT" }));
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await me.action(api.ask.ask, { question: "q" });
    const prompt: string = model.mock.calls[0][1];
    expect(prompt.slice(prompt.indexOf("All the user's screenshots"))).toContain("FULL BILL TEXT");
  });

  test("a search result for a screenshot that no longer exists is left out", async () => {
    const { me, userId, shot, t } = await setup();
    const gone = await shot(userId, "Removed", 5);
    const kept = await shot(userId, "Kept", 6);
    await t.run((ctx) => ctx.db.delete(gone));
    search.mockResolvedValue([
      { text: "SECRET FROM A REMOVED SCREENSHOT", screenshotId: gone, kind: "screenshot" },
      { text: "kept text", screenshotId: kept, kind: "screenshot" },
    ]);
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await me.action(api.ask.ask, { question: "q" });
    const prompt: string = model.mock.calls[0][1];
    expect(prompt).not.toContain("SECRET FROM A REMOVED SCREENSHOT");
    expect(prompt).toContain("kept text");
  });

  test("earlier chat turns are marked as background, apart from screenshot results", async () => {
    const { me, userId, shot } = await setup();
    await shot(userId, "Power bill", 5);
    search.mockResolvedValue([{ text: "Assistant answered: It is due Nov 16.", screenshotId: null, kind: "chat" }]);
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await me.action(api.ask.ask, { question: "q" });
    const prompt: string = model.mock.calls[0][1];
    expect(prompt).toContain("Earlier questions and answers, for background only. Take facts from the screenshots, not from these:\nAssistant answered: It is due Nov 16.");
    expect(prompt).not.toContain("Memory search results");
  });

  test("the model is told today's date in the person's time zone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 10, 16, 3, 0));
    try {
      const { me, userId, t } = await setup();
      await t.run((ctx) => ctx.db.patch(userId, { timeZone: "America/Los_Angeles" }));
      model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
      await me.action(api.ask.ask, { question: "what is due this week?" });
      expect(model.mock.calls[0][0]).toContain("Today is Sunday, 2026-11-15.");
    } finally {
      vi.useRealTimers();
    }
  });

  test("a very long question is cut before it reaches the model or memory", async () => {
    const { me } = await setup();
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await me.action(api.ask.ask, { question: "x".repeat(5000) });
    expect(search.mock.calls[0][1]).toHaveLength(1000);
    expect((model.mock.calls[0][1] as string).length).toBeLessThan(1400);
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
