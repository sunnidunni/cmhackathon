/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const model = vi.fn();
const search = vi.fn();
vi.mock("./lib/memoryClient", () => ({ addMemory: vi.fn(), searchMemory: (...a: unknown[]) => search(...a), removeDocuments: vi.fn(), removeNamespace: vi.fn() }));
vi.mock("./lib/llm", () => ({ askModel: (...a: unknown[]) => model(...a), todosFromText: vi.fn() }));
const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", {}));
  const key = await t.mutation(internal.siri.mint, { userId });
  return { t, userId, key };
}
const get = (t: ReturnType<typeof convexTest>, q: string, key: string) =>
  t.fetch(`/siri/ask?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`);

beforeEach(() => {
  model.mockReset();
  search.mockReset();
  search.mockResolvedValue([]);
});

describe("siri/ask", () => {
  test("a good key and question returns the answer as plain text", async () => {
    const { t, key } = await setup();
    model.mockResolvedValue({ found: true, answer: "Your power bill is due November 16, 2026.\n", sourceIds: [] });
    const res = await get(t, "when is my power bill due", key);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Your power bill is due November 16, 2026.");
  });

  test("a question with no match returns the exact not-found line", async () => {
    const { t, key } = await setup();
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    const res = await get(t, "what is my passport number", key);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("I couldn't find that in your screenshots.");
  });

  test("POST with a JSON body works too", async () => {
    const { t, key } = await setup();
    model.mockResolvedValue({ found: true, answer: "It is on Friday.", sourceIds: [] });
    const res = await t.fetch("/siri/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, question: "when" }) });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("It is on Friday.");
  });

  test("a missing or wrong key is 401 and never reaches the model", async () => {
    const { t } = await setup();
    expect((await get(t, "hi", "wrong")).status).toBe(401);
    expect((await t.fetch("/siri/ask?q=hi")).status).toBe(401);
    expect(model).not.toHaveBeenCalled();
  });

  test("an empty question is 400", async () => {
    const { t, key } = await setup();
    expect((await get(t, "   ", key)).status).toBe(400);
  });

  test("a very long question is cut to a cap", async () => {
    const { t, key } = await setup();
    model.mockResolvedValue({ found: false, answer: "", sourceIds: [] });
    await get(t, "a".repeat(5000), key);
    expect(String(model.mock.calls[0][1]).split("Question: ")[1].length).toBeLessThanOrEqual(500);
  });

  test("the key is stored hashed, never as given", async () => {
    const { t, key } = await setup();
    const rows = await t.run((ctx) => ctx.db.query("siriKeys").collect());
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(key);
    expect(key.length).toBeGreaterThanOrEqual(40);
  });

  describe("a phone's Shortcut can send it a few different ways", () => {
    const ok = () => model.mockResolvedValue({ found: true, answer: "It is on Friday.", sourceIds: [] });
    const post = (t: ReturnType<typeof convexTest>, body: string, type: string) =>
      t.fetch("/siri/ask", { method: "POST", headers: { "content-type": type }, body });

    test("capitalised JSON field names", async () => {
      const { t, key } = await setup();
      ok();
      const res = await post(t, JSON.stringify({ Key: key, Question: "when" }), "application/json");
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("It is on Friday.");
    });

    test("a key with spaces, a newline or quotes around it", async () => {
      const { t, key } = await setup();
      ok();
      for (const k of [` ${key} `, `${key}\n`, `"${key}"`]) {
        expect((await get(t, "when", k)).status).toBe(200);
      }
    });

    test("a form body", async () => {
      const { t, key } = await setup();
      ok();
      const res = await post(t, new URLSearchParams({ key, Question: "when" }).toString(), "application/x-www-form-urlencoded");
      expect(res.status).toBe(200);
    });

    test("a multipart form body", async () => {
      const { t, key } = await setup();
      ok();
      const fd = new FormData();
      fd.set("key", key);
      fd.set("question", "when");
      const res = await t.fetch("/siri/ask", { method: "POST", body: fd });
      expect(res.status).toBe(200);
    });

    test("the key in the URL and the question in the body, with an empty body field not overriding the URL", async () => {
      const { t, key } = await setup();
      ok();
      const res = await post(t, JSON.stringify({ key: "", question: "when" }), "application/json");
      expect(res.status).toBe(401);
      const res2 = await t.fetch(`/siri/ask?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "", Question: "when" }) });
      expect(res2.status).toBe(200);
    });

    test("a wrong key is still 401 and an empty question still 400", async () => {
      const { t, key } = await setup();
      expect((await get(t, "when", " nope ")).status).toBe(401);
      expect((await post(t, JSON.stringify({ Key: key, Question: " " }), "application/json")).status).toBe(400);
    });
  });
});
