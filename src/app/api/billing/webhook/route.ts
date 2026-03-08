import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/services/billing.service";

// POST /api/billing/webhook — Stripe webhook endpoint
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const body = await req.text();
    await handleStripeWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }
}
