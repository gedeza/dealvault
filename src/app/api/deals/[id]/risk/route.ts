import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { assessDealRisk } from "@/services/ai.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { parties: { select: { userId: true } } },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const hasAccess =
    deal.creatorId === session.user.id ||
    deal.parties.some((p) => p.userId === session.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI risk assessment not configured. Set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const risk = await assessDealRisk(id);
    return NextResponse.json(risk);
  } catch {
    return NextResponse.json({ error: "Risk assessment failed" }, { status: 500 });
  }
}
