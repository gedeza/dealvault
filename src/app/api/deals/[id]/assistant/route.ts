import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { dealRoomAssistant } from "@/services/ai.service";

const assistantSchema = z.object({
  question: z.string().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify access
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { parties: { select: { userId: true } } },
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

  try {
    const body = await req.json();
    const data = assistantSchema.parse(body);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI assistant not configured. Set ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const answer = await dealRoomAssistant({
      dealId: id,
      userId: session.user.id,
      question: data.question,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "AI assistant error" }, { status: 500 });
  }
}
