import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";

export async function POST(
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
    include: {
      parties: true,
      commissionLedger: true,
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.creatorId !== session.user.id) {
    return NextResponse.json(
      { error: "Only deal creator can settle" },
      { status: 403 }
    );
  }

  if (deal.status !== "in_progress") {
    return NextResponse.json(
      { error: "Deal must be in progress to settle" },
      { status: 400 }
    );
  }

  // Check all parties have accepted
  const pendingParties = deal.parties.filter((p) => p.status === "invited");
  if (pendingParties.length > 0) {
    return NextResponse.json(
      { error: `${pendingParties.length} parties have not yet accepted` },
      { status: 400 }
    );
  }

  // Create commission ledger entries for parties that don't have one yet
  const partiesWithCommission = deal.parties.filter((p) => p.commissionPct > 0);
  const existingLedgerPartyIds = new Set(deal.commissionLedger.map((l) => l.partyId));

  const newLedgerEntries = partiesWithCommission
    .filter((p) => !existingLedgerPartyIds.has(p.id))
    .map((p) => ({
      dealId: id,
      partyId: p.id,
      agreedPct: p.commissionPct,
      calculatedAmount: deal.value * p.commissionPct,
      status: "agreed",
    }));

  await prisma.$transaction([
    // Create missing ledger entries
    ...newLedgerEntries.map((entry) =>
      prisma.commissionLedger.create({ data: entry })
    ),
    // Update deal status to settled
    prisma.deal.update({
      where: { id },
      data: { status: "settled" },
    }),
  ]);

  await logTimelineEvent({
    dealId: id,
    userId: session.user.id,
    eventType: "deal_settled",
    description: `Deal settled. ${partiesWithCommission.length} commission entries finalized.`,
    metadata: {
      totalValue: deal.value,
      commissionPool: deal.commissionPool,
      totalCommission: deal.value * deal.commissionPool,
      parties: partiesWithCommission.length,
    },
  });

  return NextResponse.json({ message: "Deal settled successfully" });
}
