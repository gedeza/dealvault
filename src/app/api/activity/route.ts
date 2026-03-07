import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get deals the user is involved in
  const userDeals = await prisma.deal.findMany({
    where: {
      OR: [
        { creatorId: session.user.id },
        { parties: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true },
  });

  const dealIds = userDeals.map((d) => d.id);

  // Get recent timeline events for those deals
  const events = await prisma.dealTimeline.findMany({
    where: { dealId: { in: dealIds } },
    include: {
      user: { select: { id: true, name: true } },
      deal: { select: { id: true, dealNumber: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(events);
}
