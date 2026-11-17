// The one place Shots calls OpenAI (the Responses API, with a JSON schema for the reply).

// Used when the deployment does not name a model.
const DEFAULT_MODEL = "gpt-6.1-terra";
export const visionModel = () => process.env.OPENAI_VISION_MODEL ?? DEFAULT_MODEL;
export const askModelName = () => process.env.OPENAI_ASK_MODEL ?? DEFAULT_MODEL;

// A call that has not answered by now is given up, so one hung request cannot hold a queue slot or a person's question.
export const OPENAI_TIMEOUT_MS = 60_000;

type Input = { role: "system" | "user"; content: string | { type: string; [key: string]: unknown }[] };

// Returns the reply text, which is JSON matching `schema`.
// Throws "OpenAI <status>: <start of the body>" on an error status, and "OpenAI timed out" when it gives up.
export async function respond(opts: { model: string; input: Input[]; schemaName: string; schema: object; timeoutMs?: number }): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? OPENAI_TIMEOUT_MS;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: abort.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: opts.model,
        input: opts.input,
        // Screenshots hold private text. Ask OpenAI not to keep the request and reply for later retrieval.
        store: false,
        text: { format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema } },
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
    return text;
  } catch (e) {
    if (abort.signal.aborted) throw new Error(`OpenAI timed out after ${Math.round(timeoutMs / 1000)}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// A 429 means "slow down" or "this account is out of credit". Waiting fixes the first and never the second.
export const isRateLimit = (error: string) => /^OpenAI 429/.test(error) && !/insufficient_quota/.test(error);
