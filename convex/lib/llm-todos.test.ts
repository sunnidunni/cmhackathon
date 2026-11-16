import { afterEach, describe, expect, test, vi } from "vitest";
import { todosFromText } from "./llm";

const row = { title: "t", summary: "s", text: "x", dates: [] as string[] };
afterEach(() => vi.unstubAllGlobals());

const reply = (body: object) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

describe("todosFromText", () => {
  test("throws when the model answers 200 with no output text, so the row is retried", async () => {
    reply({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] });
    await expect(todosFromText(row)).rejects.toThrow();
  });

  test("returns the cleaned list when the model answers", async () => {
    reply({ output_text: JSON.stringify({ todos: ["Pay the bill"] }) });
    await expect(todosFromText(row)).resolves.toEqual(["Pay the bill"]);
  });
});
