import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";

const createCommissionSchema = z.object({
  partyId: z.string(),
  agreedPct: z.number().min(0).max(1),
});

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
    include: { parties: true },
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

  const ledger = await prisma.commissionLedger.findMany({
    where: { dealId: id },
    include: {
      party: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ledger);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.creatorId !== session.user.id) {
    return NextResponse.json(
      { error: "Only deal creator can manage commissions" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createCommissionSchema.parse(body);

    const party = await prisma.dealParty.findUnique({
      where: { id: data.partyId },
      include: { user: { select: { name: true } } },
    });

    if (!party || party.dealId !== id) {
      return NextResponse.json({ error: "Party not found in this deal" }, { status: 404 });
    }

    const calculatedAmount = deal.value * data.agreedPct;

    // Use transaction to prevent race condition on commission pool validation
    const ledgerEntry = await prisma.$transaction(async (tx) => {
      // Check total commission doesn't exceed pool
      const existingCommissions = await tx.commissionLedger.findMany({
        where: { dealId: id, partyId: { not: data.partyId } },
      });
      const totalExisting = existingCommissions.reduce((sum, c) => sum + c.agreedPct, 0);

      if (totalExisting + data.agreedPct > deal.commissionPool) {
        throw new Error(
          `Total commission (${((totalExisting + data.agreedPct) * 100).toFixed(2)}%) exceeds pool (${(deal.commissionPool * 100).toFixed(2)}%)`
        );
      }

      // Upsert: update if exists, create if not
      const existing = await tx.commissionLedger.findFirst({
        where: { dealId: id, partyId: data.partyId },
      });

      let entry;
      if (existing) {
        entry = await tx.commissionLedger.update({
          where: { id: existing.id },
          data: { agreedPct: data.agreedPct, calculatedAmount },
          include: {
            party: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        });
      } else {
        entry = await tx.commissionLedger.create({
          data: {
            dealId: id,
            partyId: data.partyId,
            agreedPct: data.agreedPct,
            calculatedAmount,
          },
          include: {
            party: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        });
      }

      // Update party's commissionPct to match
      await tx.dealParty.update({
        where: { id: data.partyId },
        data: { commissionPct: data.agreedPct },
      });

      return entry;
    });

    await logTimelineEvent({
      dealId: id,
      userId: session.user.id,
      eventType: "commission_agreed",
      description: `Commission for ${party.user.name} set to ${(data.agreedPct * 100).toFixed(2)}% (${deal.currency} ${calculatedAmount.toLocaleString()})`,
      metadata: { partyId: data.partyId, agreedPct: data.agreedPct, calculatedAmount },
    });

    return NextResponse.json(ledgerEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("exceeds pool")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to set commission" }, { status: 500 });
  }
}
