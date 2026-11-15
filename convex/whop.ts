import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyWhopSignature } from "./lib/whop_signature";

const PRICE_USD = 9;

function whopApiBase() {
  return process.env.WHOP_ENVIRONMENT === "production"
    ? "https://api.whop.com/api/v1"
    : "https://sandbox-api.whop.com/api/v1";
}

export const createCheckout = action({
  args: { redirectUrl: v.optional(v.string()) },
  handler: async (ctx, { redirectUrl }): Promise<{ purchaseUrl: string }> => {
    const { userId, plan } = await ctx.runQuery(internal.plan.currentUser, {});
    if (plan === "paid") throw new Error("Already upgraded");
    const apiKey = process.env.WHOP_API_KEY;
    const accountId = process.env.WHOP_ACCOUNT_ID;
    if (!apiKey || !accountId) throw new Error("Payments are not set up yet");
    const res = await fetch(`${whopApiBase()}/checkout_configurations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: accountId,
        metadata: { convexUserId: userId },
        ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
        variant: { billing_type: "one_time", initial_price: PRICE_USD, currency: "usd", title: "Rooms Full Library" },
      }),
    });
    if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
    const body = (await res.json()) as { purchase_url?: string };
    if (!body.purchase_url) throw new Error("Checkout failed");
    return { purchaseUrl: body.purchase_url };
  },
});

export const webhook = httpAction(async (ctx, request) => {
  const rawBody = await request.text();
  const valid = await verifyWhopSignature(
    process.env.WHOP_WEBHOOK_SECRET ?? "",
    {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    },
    rawBody,
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let event: { type?: string; data?: { metadata?: { convexUserId?: unknown } | null } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  if (event.type !== "payment.succeeded") return new Response("Ignored", { status: 200 });
  const userId = event.data?.metadata?.convexUserId;
  if (typeof userId !== "string") return new Response("No user", { status: 200 });
  const result = await ctx.runMutation(internal.plan.markPaid, { userId });
  return new Response(result, { status: 200 });
});
