import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";
import { createNotification } from "@/services/notification.service";
import { broadcastToDeal } from "@/lib/sse";
import { sendDealEventEmail } from "@/services/email.service";

const addPartySchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "seller",
    "buyer",
    "seller_mandate",
    "buyer_mandate",
    "seller_intermediary",
    "buyer_intermediary",
  ]),
  commissionPct: z.number().min(0).max(1).default(0),
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

  // Verify user is a party or creator
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

  const parties = await prisma.dealParty.findMany({
    where: { dealId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: true,
    },
  });

  return NextResponse.json(parties);
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

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Only deal creator can invite parties" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = addPartySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. They must register first." },
        { status: 404 }
      );
    }

    const existing = await prisma.dealParty.findUnique({
      where: { dealId_userId: { dealId: id, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a party to this deal" },
        { status: 409 }
      );
    }

    const side = data.role.startsWith("seller") || data.role === "seller"
      ? "sell"
      : "buy";

    const existingParties = await prisma.dealParty.count({
      where: { dealId: id, side },
    });

    const party = await prisma.dealParty.create({
      data: {
        dealId: id,
        userId: user.id,
        role: data.role,
        side,
        positionInChain: existingParties,
        commissionPct: data.commissionPct,
        status: "invited",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logTimelineEvent({
      dealId: id,
      userId: session.user.id,
      eventType: "party_invited",
      description: `${user.name} invited as ${data.role.replace("_", " ")}`,
      metadata: { partyId: party.id, role: data.role, email: data.email },
    });

    await createNotification({
      userId: user.id,
      type: "party_invited",
      title: "Deal Invitation",
      message: `You've been invited to "${deal.title}" as ${data.role.replace("_", " ")}`,
      link: `/deals/${id}`,
    });

    // SSE: broadcast party invite to deal room
    broadcastToDeal(id, "party_invited", {
      partyId: party.id,
      role: data.role,
      side,
      user: party.user,
    });

    // Email: send invite email to invited user
    sendDealEventEmail({
      dealId: id,
      specificUserIds: [user.id],
      eventType: "party_invited",
      dealTitle: deal.title,
      dealNumber: deal.dealNumber,
      actorName: session.user.name || "The deal creator",
      detail: `You've been invited as ${data.role.replace("_", " ")}`,
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add party" }, { status: 500 });
  }
}
