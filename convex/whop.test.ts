/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { FREE_IMPORT_LIMIT } from "./lib/importPlan";
import { signWhopPayload, verifyWhopSignature } from "./lib/whop_signature";

const modules = import.meta.glob("./**/*.ts");
const SECRET = "ws_testsecret123";

beforeEach(() => vi.stubEnv("WHOP_WEBHOOK_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

async function setup() {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { isAnonymous: true, plan: "free" }));
  return { t, userId };
}

async function deliver(t: ReturnType<typeof convexTest>, userId: string, opts: { secret?: string; type?: string; data?: Record<string, unknown> } = {}) {
  const body = JSON.stringify({ id: "msg_1", type: opts.type ?? "payment.succeeded", data: opts.data ?? { id: "pay_1", metadata: { convexUserId: userId } } });
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

describe("import cap", () => {
  test("free users are capped and a paid webhook lifts the cap", async () => {
    const { t, userId } = await setup();
    const me = t.withIdentity({ subject: `${userId}|s` });
    expect(await me.query(api.sync.importInfo, {})).toEqual({ plan: "free", limit: FREE_IMPORT_LIMIT });
    await deliver(t, userId);
    expect(await me.query(api.sync.importInfo, {})).toEqual({ plan: "paid", limit: null });
  });
});

describe("the signature format", () => {
  // Computed outside this code with Node's crypto, the way Whop's own SDK derives it: HMAC-SHA256 over
  // "<id>.<timestamp>.<body>", keyed with the literal bytes of the ws_ secret, base64, prefixed "v1,".
  const secret = "ws_fixedvector_0123456789abcdef";
  const headers = { id: "msg_fixed_1", timestamp: "1794787200", signature: "v1,R4gfkVAmeRUS77n17yWicJCYdVl/HH79rR81V8Qe+V8=" };
  const body = '{"id":"msg_fixed_1","type":"payment.succeeded","data":{"id":"pay_fixed_1","metadata":{"convexUserId":"x"}}}';
  const at = 1794787200 * 1000;

  test("accepts a signature made by an independent implementation", async () => {
    expect(await verifyWhopSignature(secret, headers, body, at)).toBe(true);
    // Whop may send several signatures, space separated; one match is enough.
    expect(await verifyWhopSignature(secret, { ...headers, signature: `v1,AAAA ${headers.signature}` }, body, at)).toBe(true);
  });
  test("rejects a changed body, a wrong secret, and a delivery more than five minutes old or early", async () => {
    expect(await verifyWhopSignature(secret, headers, body.replace("pay_fixed_1", "pay_fixed_2"), at)).toBe(false);
    expect(await verifyWhopSignature("ws_other", headers, body, at)).toBe(false);
    expect(await verifyWhopSignature(secret, headers, body, at + 5 * 60 * 1000 + 1000)).toBe(false);
    expect(await verifyWhopSignature(secret, headers, body, at - 5 * 60 * 1000 - 1000)).toBe(false);
    expect(await verifyWhopSignature(secret, headers, body, at + 4 * 60 * 1000)).toBe(true);
    expect(await verifyWhopSignature("", headers, body, at)).toBe(false);
  });
});

describe("refunds", () => {
  // The shape Whop sends for refund.created and refund.updated: the payment is an object, with its id inside.
  const refund = (status: string, paymentId = "pay_1") => ({ type: "refund.created", data: { id: "rf_1", status, amount: 9, payment: { id: paymentId, billing_reason: "one_time" } } });

  test("a refund that went through puts the user back on the free plan", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    expect(await planOf(t, userId)).toBe("paid");
    const res = await deliver(t, userId, refund("succeeded"));
    expect(await res.text()).toBe("refunded");
    expect(await planOf(t, userId)).toBe("free");
  });

  test("a pending or failed refund changes nothing, and neither does a refund for a payment we never saw", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    await deliver(t, userId, refund("pending"));
    await deliver(t, userId, refund("failed"));
    expect(await planOf(t, userId)).toBe("paid");
    expect(await (await deliver(t, userId, refund("succeeded", "pay_unknown"))).text()).toBe("refund_recorded");
    expect(await planOf(t, userId)).toBe("paid");
  });

  test("a refunded payment delivered again does not upgrade the user again", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    await deliver(t, userId, refund("succeeded"));
    expect(await (await deliver(t, userId)).text()).toBe("refunded");
    expect(await planOf(t, userId)).toBe("free");
  });

  test("a user with a second, standing payment stays paid when the first is refunded", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    await deliver(t, userId, { data: { id: "pay_2", metadata: { convexUserId: userId } } });
    expect(await (await deliver(t, userId, refund("succeeded"))).text()).toBe("still_paid");
    expect(await planOf(t, userId)).toBe("paid");
  });

  test("a refund that arrives before its payment is remembered, so the late payment upgrades no one", async () => {
    const { t, userId } = await setup();
    expect(await (await deliver(t, userId, refund("succeeded"))).text()).toBe("refund_recorded");
    expect(await (await deliver(t, userId)).text()).toBe("refunded");
    expect(await planOf(t, userId)).toBe("free");
    // The same refund delivered again changes nothing.
    expect(await (await deliver(t, userId, refund("succeeded"))).text()).toBe("already_refunded");
    expect(await planOf(t, userId)).toBe("free");
  });

  test("the newer refund shape, with payment_id, is understood too; a refund naming no payment is ignored", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    expect(await (await deliver(t, userId, { type: "refund.updated", data: { id: "rf_1", status: "succeeded", payment: null } })).text()).toBe("Ignored");
    expect(await planOf(t, userId)).toBe("paid");
    expect(await (await deliver(t, userId, { type: "refund.updated", data: { id: "rf_1", status: "succeeded", payment_id: "pay_1" } })).text()).toBe("refunded");
    expect(await planOf(t, userId)).toBe("free");
  });

  test("a refund with a bad signature is rejected", async () => {
    const { t, userId } = await setup();
    await deliver(t, userId);
    expect((await deliver(t, userId, { ...refund("succeeded"), secret: "ws_wrong" })).status).toBe(401);
    expect(await planOf(t, userId)).toBe("paid");
  });
});

describe("which Whop a deployment talks to", () => {
  const checkout = async (environment: string | undefined) => {
    const { t, userId } = await setup();
    vi.stubEnv("WHOP_API_KEY", "key");
    vi.stubEnv("WHOP_ACCOUNT_ID", "biz_1");
    if (environment !== undefined) vi.stubEnv("WHOP_ENVIRONMENT", environment);
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify({ purchase_url: "https://pay.example/1" })));
    vi.stubGlobal("fetch", fetchMock);
    const run = t.withIdentity({ subject: `${userId}|s` }).action(api.whop.createCheckout, {});
    return { run, fetchMock };
  };
  afterEach(() => vi.unstubAllGlobals());

  test("with no environment named, checkout is off and Whop is never called", async () => {
    const { run, fetchMock } = await checkout(undefined);
    await expect(run).rejects.toThrow("Payments are not set up yet");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  test("a misspelled environment is off too", async () => {
    const { run, fetchMock } = await checkout("prod");
    await expect(run).rejects.toThrow("Payments are not set up yet");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  test("sandbox and production each call their own Whop", async () => {
    const sandbox = await checkout("sandbox");
    expect(await sandbox.run).toEqual({ purchaseUrl: "https://pay.example/1" });
    expect(sandbox.fetchMock.mock.calls[0][0]).toBe("https://sandbox-api.whop.com/api/v1/checkout_configurations");
    const production = await checkout("production");
    await production.run;
    expect(production.fetchMock.mock.calls[0][0]).toBe("https://api.whop.com/api/v1/checkout_configurations");
  });
});
