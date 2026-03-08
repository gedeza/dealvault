import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { processEscrowAction } from "@/services/workflow.service";
import { ESCROW_ACTIONS } from "@/types/workflow";
import { checkFeatureGate } from "@/lib/tier-guard";

// GET /api/deals/[id]/workflow/escrow — Get escrow record
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

  const workflow = await prisma.dealWorkflow.findUnique({
    where: { dealId: id },
  });

  if (!workflow) {
    return NextResponse.json({ error: "No workflow for this deal" }, { status: 404 });
  }

  const escrow = await prisma.escrowRecord.findUnique({
    where: { workflowId: workflow.id },
    include: {
      blockConfirmedBy: { select: { id: true, name: true } },
      deliveryConfirmedBy: { select: { id: true, name: true } },
      releasedBy: { select: { id: true, name: true } },
      refundedBy: { select: { id: true, name: true } },
    },
  });

  if (!escrow) {
    return NextResponse.json(null);
  }

  return NextResponse.json(escrow);
}

const escrowActionSchema = z.object({
  action: z.enum(ESCROW_ACTIONS as unknown as [string, ...string[]]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// PATCH /api/deals/[id]/workflow/escrow — Progress escrow state
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const gate = await checkFeatureGate(session.user.id, "escrowWorkflow", "Escrow Workflow", "reef");
    if (gate) return gate;

  const { id } = await params;

  const workflow = await prisma.dealWorkflow.findUnique({
    where: { dealId: id },
  });

  if (!workflow) {
    return NextResponse.json({ error: "No workflow for this deal" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = escrowActionSchema.parse(body);

    const escrow = await processEscrowAction({
      dealId: id,
      workflowId: workflow.id,
      userId: session.user.id,
      action: data.action as (typeof ESCROW_ACTIONS)[number],
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    });

    return NextResponse.json(escrow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process escrow action" }, { status: 500 });
  }
}
