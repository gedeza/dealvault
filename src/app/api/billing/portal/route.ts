import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortalSession } from "@/services/billing.service";

// POST /api/billing/portal — Create Stripe Customer Portal session
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = await createPortalSession(session.user.id);
  if (!url) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ url });
}
