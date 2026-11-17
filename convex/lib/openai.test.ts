import { afterEach, describe, expect, test, vi } from "vitest";
import { OPENAI_TIMEOUT_MS, isRateLimit, respond } from "./openai";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const call = () => respond({ model: "m", input: [{ role: "user", content: "hi" }], schemaName: "s", schema: { type: "object" } });

describe("respond", () => {
  test("asks OpenAI not to store the request, and returns the reply text", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify({ output_text: '{"a":1}' })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await call()).toBe('{"a":1}');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.store).toBe(false);
    expect(body.text.format).toMatchObject({ type: "json_schema", name: "s", strict: true });
  });

  test("an error status throws with the status and the start of the body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("server exploded", { status: 500 })));
    await expect(call()).rejects.toThrow("OpenAI 500: server exploded");
  });

  test("a request that never answers is given up after the timeout", async () => {
    vi.useFakeTimers();
    // Never resolves by itself; rejects only when the caller aborts, as a real fetch does.
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new Error("aborted"))))),
    );
    const pending = expect(call()).rejects.toThrow("OpenAI timed out after 60s");
    await vi.advanceTimersByTimeAsync(OPENAI_TIMEOUT_MS + 1);
    await pending;
  });
});

describe("isRateLimit", () => {
  test("a 429 that says slow down is a rate limit; out of credit and other errors are not", () => {
    expect(isRateLimit('OpenAI 429: {"error":{"code":"rate_limit_exceeded"}}')).toBe(true);
    expect(isRateLimit('OpenAI 429: {"error":{"code":"insufficient_quota","type":"insufficient_quota"}}')).toBe(false);
    expect(isRateLimit("OpenAI 500: oops")).toBe(false);
    expect(isRateLimit("OpenAI timed out after 60s")).toBe(false);
  });
});
