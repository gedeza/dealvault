import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { submitPhaseApproval } from "@/services/workflow.service";
import { WORKFLOW_PHASES, APPROVAL_ACTIONS } from "@/types/workflow";

// GET /api/deals/[id]/workflow/approvals — List all approvals
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

  const approvals = await prisma.phaseApproval.findMany({
    where: { workflowId: workflow.id },
    include: {
      decidedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(approvals);
}

const submitApprovalSchema = z.object({
  phase: z.enum(WORKFLOW_PHASES as unknown as [string, ...string[]]),
  action: z.enum(APPROVAL_ACTIONS as unknown as [string, ...string[]]),
  notes: z.string().optional(),
});

// POST /api/deals/[id]/workflow/approvals — Submit approval decision
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workflow = await prisma.dealWorkflow.findUnique({
    where: { dealId: id },
  });

  if (!workflow) {
    return NextResponse.json({ error: "No workflow for this deal" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = submitApprovalSchema.parse(body);

    const approval = await submitPhaseApproval({
      dealId: id,
      workflowId: workflow.id,
      phase: data.phase as (typeof WORKFLOW_PHASES)[number],
      action: data.action as "approve" | "reject" | "request_changes",
      notes: data.notes,
      userId: session.user.id,
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit approval" }, { status: 500 });
  }
}
