import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { initiateCustodyLog, getFullCustodyLog } from "@/services/custody.service";
import { CUSTODIAN_TYPES } from "@/types/workflow";

// GET /api/deals/[id]/custody — Get full custody chain
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

  const custody = await getFullCustodyLog(id);
  if (!custody) {
    return NextResponse.json(null);
  }

  return NextResponse.json(custody);
}

const initiateCustodySchema = z.object({
  sealId: z.string().min(1, "Seal ID is required"),
  custodianName: z.string().optional(),
  custodianType: z.enum(CUSTODIAN_TYPES as unknown as [string, ...string[]]).optional(),
  custodianContact: z.string().optional(),
});

// POST /api/deals/[id]/custody — Initiate custody tracking
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = initiateCustodySchema.parse(body);

    const custody = await initiateCustodyLog({
      dealId: id,
      userId: session.user.id,
      sealId: data.sealId,
      custodianName: data.custodianName,
      custodianType: data.custodianType,
      custodianContact: data.custodianContact,
    });

    return NextResponse.json(custody, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to initiate custody" }, { status: 500 });
  }
}
