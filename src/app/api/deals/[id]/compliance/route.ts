import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getDealCompliance,
  initializeComplianceForDeal,
  updateComplianceItem,
} from "@/services/compliance.service";

// GET /api/deals/[id]/compliance — Get compliance checklists for a deal
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
    select: { creatorId: true, commodity: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const party = await prisma.dealParty.findUnique({
    where: { dealId_userId: { dealId: id, userId: session.user.id } },
  });
  if (!party && deal.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Auto-initialize compliance checklists if not present
  await initializeComplianceForDeal(id, deal.commodity);

  const checklists = await getDealCompliance(id);
  return NextResponse.json(checklists);
}

// PATCH /api/deals/[id]/compliance — Update a compliance item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    select: { creatorId: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const party = await prisma.dealParty.findUnique({
    where: { dealId_userId: { dealId: id, userId: session.user.id } },
  });
  if (!party && deal.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const { itemId, status, evidenceNote, documentId } = body;

  if (!itemId || !["met", "not_met", "na"].includes(status)) {
    return NextResponse.json(
      { error: "itemId and status (met|not_met|na) required" },
      { status: 400 }
    );
  }

  const updated = await updateComplianceItem(itemId, status, evidenceNote, documentId);
  return NextResponse.json(updated);
}
