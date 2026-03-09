import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, getUserTier, getUserLimits } from "@/services/billing.service";

// GET /api/billing — Get user's current subscription info
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserTier(session.user.id);
  const limits = await getUserLimits(session.user.id);

  return NextResponse.json({ tier, limits });
}

// POST /api/billing — Create Paystack checkout session for upgrade
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: allow specifying target tier in request body
  let targetTier: "reef" | "sovereign" = "reef";
  try {
    const body = await req.json().catch(() => ({}));
    if (body.tier === "sovereign") targetTier = "sovereign";
  } catch {
    // Default to reef
  }

  const url = await createCheckoutSession(session.user.id, session.user.email, targetTier);
  if (!url) {
    return NextResponse.json(
      { error: "Billing is not configured. Contact support." },
      { status: 503 }
    );
  }

  return NextResponse.json({ url });
}
