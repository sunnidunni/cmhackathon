import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, httpAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

// Siri reaches Shots through a Shortcut that posts a question to /siri/ask with a key.
// The key is the only thing that identifies the person, so:
// - it is made here, from 32 random bytes, and shown to its owner once;
// - only its SHA-256 hash is stored;
// - a person has at most one, and can replace it or turn Siri off, which makes the old key useless at once.

const MAX_QUESTION = 500;

async function hash(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Turns Siri on, or replaces the key when it is already on. Returns the new key: it cannot be shown again.
// An action, not a mutation, so the random bytes come from the system and not from a mutation's replayable seed.
export const enable = action({
  args: {},
  handler: async (ctx): Promise<{ key: string }> => {
    const userId = await requireUserId(ctx);
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    await ctx.runMutation(internal.siri.replaceKey, { userId, keyHash: await hash(key) });
    return { key };
  },
});

export const replaceKey = internalMutation({
  args: { userId: v.id("users"), keyHash: v.string() },
  handler: async (ctx, { userId, keyHash }) => {
    const old = await ctx.db.query("siriKeys").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const row of old) await ctx.db.delete(row._id);
    await ctx.db.insert("siriKeys", { keyHash, userId, createdAt: Date.now() });
  },
});

// Turns Siri off: the person's key stops working.
export const disable = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db.query("siriKeys").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return null;
  },
});

// Whether Siri is on for the person, and since when. Never the key.
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.query("siriKeys").withIndex("by_user", (q) => q.eq("userId", userId)).first();
    return { on: row !== null, since: row?.createdAt ?? null };
  },
});

// Ends every key on the deployment, 500 at a time. For an operator, from the CLI: npx convex run siri:revokeAll
// Use it when keys may have leaked. People turn Siri back on in Settings.
export const revokeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("siriKeys").take(500);
    for (const row of rows) await ctx.db.delete(row._id);
    if (rows.length === 500) await ctx.scheduler.runAfter(0, internal.siri.revokeAll, {});
    return rows.length;
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

// Reads the fields a Shortcut posts, as JSON or as a form. Field names are matched case-insensitively.
// Nothing is read from the address: a key in a URL ends up in logs and history.
async function readFields(req: Request) {
  const fields = new Map<string, string>();
  const put = (name: string, value: unknown) => {
    const text = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
    if (text.trim() !== "") fields.set(name.toLowerCase(), text);
  };
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData().catch(() => null);
    (form as { forEach(cb: (value: unknown, name: string) => void): void } | null)?.forEach((value: unknown, name: string) => put(name, value));
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

// The key comes in the body (field "key") or as "Authorization: Bearer <key>".
export const ask = httpAction(async (ctx, req) => {
  const fields = await readFields(req);
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1] ?? "";
  const key = (fields.get("key") ?? bearer).replace(/[\s"'\u2018\u2019\u201c\u201d]/g, "");
  const question = fields.get("question") ?? fields.get("q") ?? "";
  const userId = key === "" ? null : await ctx.runQuery(internal.siri.userForKey, { keyHash: await hash(key) });
  if (userId === null) return text("Shots doesn't know this key. Turn Siri on again in Shots, under Settings.", 401);
  const q = question.trim().slice(0, MAX_QUESTION);
  if (q === "") return text("Ask Shots a question.", 400);
  try {
    const { answer } = await ctx.runAction(internal.ask.askAs, { userId, question: q });
    return text(answer.replace(/\s+/g, " ").trim());
  } catch (e) {
    console.error("Siri ask failed", e instanceof Error ? e.message : String(e));
    return text("Shots couldn't answer right now. Try again in a moment.", 500);
  }
});
