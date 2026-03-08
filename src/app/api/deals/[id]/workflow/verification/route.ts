import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { upsertVerification } from "@/services/workflow.service";
import { VERIFICATION_RESULTS } from "@/types/workflow";
import { checkFeatureGate } from "@/lib/tier-guard";

// GET /api/deals/[id]/workflow/verification — Get verification record
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

  const record = await prisma.verificationRecord.findUnique({
    where: { workflowId: workflow.id },
    include: {
      assayDocument: {
        select: { id: true, name: true, type: true, sha256Hash: true, createdAt: true },
      },
    },
  });

  if (!record) {
    return NextResponse.json(null);
  }

  return NextResponse.json(record);
}

const verificationSchema = z.object({
  location: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  inspectorName: z.string().optional(),
  inspectorCompany: z.string().optional(),
  result: z.enum(VERIFICATION_RESULTS as unknown as [string, ...string[]]).optional(),
  findings: z.string().optional(),
  assayDocumentId: z.string().optional(),
});

// PATCH /api/deals/[id]/workflow/verification — Upsert verification record
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
    const data = verificationSchema.parse(body);

    const record = await upsertVerification({
      dealId: id,
      workflowId: workflow.id,
      userId: session.user.id,
      data,
    });

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}
