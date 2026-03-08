import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { dispatchWebhooks } from "@/services/webhook.service";

// POST /api/webhooks/[id]/test — Send a test webhook
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook || webhook.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await dispatchWebhooks({
    userId: session.user.id,
    event: "test",
    dealId: "test-deal-id",
    dealNumber: "DV-2026-0000",
    dealTitle: "Test Deal",
    detail: "This is a test webhook from DealVault.",
  });

  return NextResponse.json({ sent: true });
}
