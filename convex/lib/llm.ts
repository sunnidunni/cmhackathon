import { cleanTodos } from "./extraction";

export type AskModelReply = { found: boolean; answer: string; sourceIds: string[] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["found", "answer", "sourceIds"],
  properties: {
    found: { type: "boolean" },
    answer: { type: "string" },
    sourceIds: { type: "array", items: { type: "string" } },
  },
};

// Text-only to-do extraction for screenshots read before to-dos existed.
export async function todosFromText(row: { title: string; summary: string; text: string; dates: string[] }): Promise<string[]> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_ASK_MODEL ?? "gpt-6.1-terra",
      input: [
        {
          role: "system",
          content:
            "From what a screenshot says, list zero, one or two short instructions to this person, each starting with a verb and under 60 characters (for example Pay the Brightside Power bill). Only when it clearly asks this person to do something: pay, reply, book, go, buy, send, sign up, renew. Most have none: memes, recipes, quotes, articles and plain chat return an empty list. Never include a date, time or price unless it is in the text.",
        },
        { role: "user", content: `Title: ${row.title}\nSummary: ${row.summary}\nDates: ${row.dates.join("; ") || "none"}\nText: ${row.text.slice(0, 1500)}` },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "todos",
          strict: true,
          schema: { type: "object", additionalProperties: false, required: ["todos"], properties: { todos: { type: "array", items: { type: "string" } } } },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const text: string | undefined =
    body.output_text ??
    body.output
      ?.flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
      .find((c: { type: string }) => c.type === "output_text")?.text;
  return text ? cleanTodos(JSON.parse(text).todos) : [];
}

export async function askModel(system: string, user: string): Promise<AskModelReply> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASK_MODEL ?? "gpt-6.1-terra",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      text: { format: { type: "json_schema", name: "answer", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text: string | undefined =
    body.output_text ??
    body.output
      ?.flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
      .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI returned no text");
  const data = JSON.parse(text);
  return {
    found: data.found === true,
    answer: String(data.answer ?? ""),
    sourceIds: Array.isArray(data.sourceIds) ? data.sourceIds.map(String) : [],
  };
}
