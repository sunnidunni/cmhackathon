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

export const ask = httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  let key = url.searchParams.get("key") ?? "";
  let question = url.searchParams.get("q") ?? url.searchParams.get("question") ?? "";
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    key = String(body.key ?? key);
    question = String(body.question ?? body.q ?? question);
  }
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
