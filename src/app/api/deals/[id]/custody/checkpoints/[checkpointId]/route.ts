import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { submitCheckpointEvidence } from "@/services/custody.service";

// GET /api/deals/[id]/custody/checkpoints/[checkpointId] — Get checkpoint detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; checkpointId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, checkpointId } = await params;

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

  const checkpoint = await prisma.custodyCheckpoint.findUnique({
    where: { id: checkpointId },
    include: {
      submittedByUser: { select: { id: true, name: true } },
      confirmations: {
        include: {
          confirmedByUser: { select: { id: true, name: true } },
        },
        orderBy: { confirmedAt: "asc" },
      },
    },
  });

  if (!checkpoint) {
    return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
  }

  return NextResponse.json(checkpoint);
}

const submitEvidenceSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().optional(),
  notes: z.string().optional(),
  sealIntact: z.boolean().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(["g", "kg", "oz"]).optional(),
  photoPath: z.string().optional(),
  photoHash: z.string().optional(),
  videoPath: z.string().optional(),
  videoHash: z.string().optional(),
});

// PATCH /api/deals/[id]/custody/checkpoints/[checkpointId] — Submit evidence
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; checkpointId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, checkpointId } = await params;

  try {
    const body = await req.json();
    const data = submitEvidenceSchema.parse(body);

    const checkpoint = await submitCheckpointEvidence({
      dealId: id,
      checkpointId,
      userId: session.user.id,
      data,
    });

    return NextResponse.json(checkpoint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit evidence" }, { status: 500 });
  }
}
