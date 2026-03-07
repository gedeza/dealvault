import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { confirmCheckpoint } from "@/services/custody.service";

const confirmSchema = z.object({
  status: z.enum(["confirmed", "disputed"]),
  disputeReason: z.string().optional(),
});

// POST /api/deals/[id]/custody/checkpoints/[checkpointId]/confirm
export async function POST(
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
    const data = confirmSchema.parse(body);

    if (data.status === "disputed" && !data.disputeReason) {
      return NextResponse.json(
        { error: "Dispute reason is required when disputing a checkpoint" },
        { status: 400 }
      );
    }

    const confirmation = await confirmCheckpoint({
      dealId: id,
      checkpointId,
      userId: session.user.id,
      status: data.status,
      disputeReason: data.disputeReason,
    });

    return NextResponse.json(confirmation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to confirm checkpoint" }, { status: 500 });
  }
}
