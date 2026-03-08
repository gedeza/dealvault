import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";
import { sanitizeString } from "@/lib/sanitize";
import { broadcastToDeal } from "@/lib/sse";

const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  visibility: z.enum(["deal", "side", "private"]).default("deal"),
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

  const userParty = deal.parties.find((p) => p.userId === session.user.id);
  const isCreator = deal.creatorId === session.user.id;

  if (!userParty && !isCreator) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { dealId: id },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const userSide = userParty?.side;
  const filtered = messages.filter((msg) => {
    if (msg.visibility === "deal") return true;
    if (msg.visibility === "private") return msg.senderId === session.user.id;
    if (msg.visibility === "side" && userSide) {
      return msg.senderId === session.user.id ||
        deal.parties.some(
          (p) => p.userId === msg.senderId && p.side === userSide
        );
    }
    return false;
  });

  return NextResponse.json(filtered);
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
    const data = messageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        dealId: id,
        senderId: session.user.id,
        content: sanitizeString(data.content),
        visibility: data.visibility,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    await logTimelineEvent({
      dealId: id,
      userId: session.user.id,
      eventType: "message_sent",
      description: `Message sent in deal room`,
    });

    // SSE: broadcast new message to deal room (only deal-visible messages)
    if (data.visibility === "deal") {
      broadcastToDeal(id, "new_message", {
        id: message.id,
        content: message.content,
        sender: message.sender,
        visibility: message.visibility,
        createdAt: message.createdAt,
      }, session.user.id);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
