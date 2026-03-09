import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/services/billing.service";

// POST /api/billing/webhook — Paystack webhook endpoint
export async function POST(req: Request) {
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const body = await req.text();
    await handlePaystackWebhook(body, signature);
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }
}
