/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { signWhopPayload } from "./lib/whop_signature";

const modules = import.meta.glob("./**/*.ts");
const SECRET = "ws_testsecret123";

beforeEach(() => vi.stubEnv("WHOP_WEBHOOK_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true, plan: "free" }));
  return { t, userId };
}

async function deliver(t: ReturnType<typeof convexTest>, userId: string, opts: { secret?: string; type?: string } = {}) {
  const body = JSON.stringify({ id: "msg_1", type: opts.type ?? "payment.succeeded", data: { id: "pay_1", metadata: { convexUserId: userId } } });
  const id = "msg_1";
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = await signWhopPayload(opts.secret ?? SECRET, id, ts, body);
  return t.fetch("/whop", {
    method: "POST",
    body,
    headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": signature, "content-type": "application/json" },
  });
}

const planOf = (t: ReturnType<typeof convexTest>, userId: any) => t.run(async (ctx) => (await ctx.db.get(userId))?.plan);

describe("whop webhook", () => {
  test("valid signature flips the plan to paid", async () => {
    const { t, userId } = await setup();
    const res = await deliver(t, userId);
    expect(res.status).toBe(200);
    expect(await planOf(t, userId)).toBe("paid");
  });

  test("bad signature is rejected and plan stays free", async () => {
    const { t, userId } = await setup();
    const res = await deliver(t, userId, { secret: "ws_wrong" });
    expect(res.status).toBe(401);
    expect(await planOf(t, userId)).toBe("free");
  });

  test("unknown user is ignored", async () => {
    const { t, userId } = await setup();
    const res = await deliver(t, "not-a-real-id");
    expect(res.status).toBe(200);
    expect(await planOf(t, userId)).toBe("free");
  });

  test("repeat delivery is harmless", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    const res = await deliver(t, userId);
    expect(res.status).toBe(200);
    expect(await planOf(t, userId)).toBe("paid");
  });

  test("other event types do not change the plan", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId, { type: "payment.failed" });
    expect(await planOf(t, userId)).toBe("free");
  });
});

describe("myPlan", () => {
  test("returns the caller's plan", async () => {
    const { t, userId } = await setup();
    const me = t.withIdentity({ subject: `${userId}|s` });
    expect(await me.query(api.plan.myPlan, {})).toBe("free");
    await deliver(t, userId);
    expect(await me.query(api.plan.myPlan, {})).toBe("paid");
  });
});
