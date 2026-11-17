import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyWhopSignature } from "./lib/whop_signature";

const PRICE_USD = 9;

// WHOP_ENVIRONMENT must say which Whop this deployment talks to: "production" (real money) or "sandbox" (test cards).
// Unset or anything else means payments are off. It used to mean sandbox, so a production deployment that
// forgot the variable would have sold upgrades for test cards.
function whopApiBase() {
  const env = process.env.WHOP_ENVIRONMENT;
  if (env === "production") return "https://api.whop.com/api/v1";
  if (env === "sandbox") return "https://sandbox-api.whop.com/api/v1";
  return null;
}

export const createCheckout = action({
  args: { redirectUrl: v.optional(v.string()) },
  handler: async (ctx, { redirectUrl }): Promise<{ purchaseUrl: string }> => {
    const { userId, plan } = await ctx.runQuery(internal.plan.currentUser, {});
    if (plan === "paid") throw new Error("Already upgraded");
    const apiKey = process.env.WHOP_API_KEY;
    const accountId = process.env.WHOP_ACCOUNT_ID;
    const base = whopApiBase();
    if (!apiKey || !accountId || !base) throw new Error("Payments are not set up yet");
    const res = await fetch(`${base}/checkout_configurations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: accountId,
        metadata: { convexUserId: userId },
        redirect_url: redirectUrl ?? `${process.env.CONVEX_SITE_URL}/whop/done`,
        variant: { billing_type: "one_time", initial_price: PRICE_USD, currency: "usd", title: "Shots Full Library" },
      }),
    });
    if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
    const body = (await res.json()) as { purchase_url?: string };
    if (!body.purchase_url) throw new Error("Checkout failed");
    return { purchaseUrl: body.purchase_url };
  },
});

export const done = httpAction(async () => {
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shots</title><body style="font-family:-apple-system,sans-serif;background:#FAF6EE;color:#2B1D14;text-align:center;padding:72px 24px"><h1>Payment received</h1><p>Close this window to go back to Shots.</p></body>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
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

  // payment.succeeded carries a payment (id pay_..., with our metadata from the checkout).
  // refund.created and refund.updated carry a refund: its status, and the payment it reverses as payment.id.
  // (Whop's newer refund object names it payment_id; both are read.) Only a refund that went through counts.
  let event: { type?: string; data?: { id?: unknown; payment?: { id?: unknown } | null; payment_id?: unknown; status?: unknown; metadata?: { convexUserId?: unknown } | null } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  if (event.type === "refund.created" || event.type === "refund.updated") {
    const whopPaymentId = event.data?.payment?.id ?? event.data?.payment_id;
    if (event.data?.status !== "succeeded" || typeof whopPaymentId !== "string") return new Response("Ignored", { status: 200 });
    return new Response(await ctx.runMutation(internal.plan.markRefunded, { whopPaymentId }), { status: 200 });
  }
  if (event.type !== "payment.succeeded") return new Response("Ignored", { status: 200 });
  const userId = event.data?.metadata?.convexUserId;
  const whopPaymentId = event.data?.id;
  if (typeof userId !== "string" || typeof whopPaymentId !== "string") return new Response("No user", { status: 200 });
  const result = await ctx.runMutation(internal.plan.markPaid, { userId, whopPaymentId });
  return new Response(result, { status: 200 });
});
