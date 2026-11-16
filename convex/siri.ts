import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalMutation, internalQuery } from "./_generated/server";

const MAX_QUESTION = 500;

async function hash(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Run from the CLI: npx convex run siri:mint '{"userId":"..."}'. Only the hash is stored.
export const mint = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await ctx.db.insert("siriKeys", { keyHash: await hash(key), userId, createdAt: Date.now() });
    return key;
  },
});

export const userForKey = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    const row = await ctx.db.query("siriKeys").withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash)).unique();
    return row?.userId ?? null;
  },
});

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

// Field names are matched case-insensitively, and a body field wins only when it has a value, so a
// Shortcut that sends JSON, a form, or just a URL all work.
async function readFields(req: Request) {
  const fields = new Map<string, string>();
  const put = (name: string, value: unknown) => {
    const text = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
    if (text.trim() !== "") fields.set(name.toLowerCase(), text);
  };
  new URL(req.url).searchParams.forEach((value, name) => put(name, value));
  if (req.method !== "POST") return fields;
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData().catch(() => null);
    form?.forEach((value, name) => put(name, value));
    return fields;
  }
  const raw = await req.text().catch(() => "");
  try {
    const body = JSON.parse(raw);
    if (body !== null && typeof body === "object") for (const [name, value] of Object.entries(body)) put(name, value);
  } catch {
    new URLSearchParams(raw).forEach((value, name) => put(name, value));
  }
  return fields;
}

export const ask = httpAction(async (ctx, req) => {
  const fields = await readFields(req);
  const key = (fields.get("key") ?? "").replace(/[\s"'\u2018\u2019\u201c\u201d]/g, "");
  const question = fields.get("question") ?? fields.get("q") ?? "";
  const userId = key === "" ? null : await ctx.runQuery(internal.siri.userForKey, { keyHash: await hash(key) });
  if (userId === null) return text("Psst doesn't know this key.", 401);
  const q = question.trim().slice(0, MAX_QUESTION);
  if (q === "") return text("Ask Psst a question.", 400);
  try {
    const { answer } = await ctx.runAction(internal.ask.askAs, { userId, question: q });
    return text(answer.replace(/\s+/g, " ").trim());
  } catch (e) {
    console.error("Siri ask failed", e instanceof Error ? e.message : String(e));
    return text("Psst couldn't answer right now. Try again in a moment.", 500);
  }
});
