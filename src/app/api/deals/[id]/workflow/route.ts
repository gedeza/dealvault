import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  createWorkflow,
  advancePhase,
  getFullWorkflow,
} from "@/services/workflow.service";
import { WORKFLOW_PHASES } from "@/types/workflow";

// GET /api/deals/[id]/workflow — Get full workflow state
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

  const workflow = await getFullWorkflow(id);
  if (!workflow) {
    return NextResponse.json({ error: "No workflow for this deal" }, { status: 404 });
  }

  return NextResponse.json(workflow);
}

// POST /api/deals/[id]/workflow — Create workflow for a deal
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await createWorkflow(id, session.user.id);
    return NextResponse.json(result.workflow, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}

const advancePhaseSchema = z.object({
  phase: z.enum(WORKFLOW_PHASES as unknown as [string, ...string[]]),
  reason: z.string().optional(),
});

// PATCH /api/deals/[id]/workflow — Advance or rollback phase
export async function PATCH(
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
    const data = advancePhaseSchema.parse(body);

    const result = await advancePhase(
      id,
      data.phase as (typeof WORKFLOW_PHASES)[number],
      session.user.id,
      data.reason
    );

    return NextResponse.json(result.workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to advance phase" }, { status: 500 });
  }
}
