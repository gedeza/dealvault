import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";

const updatePartySchema = z.object({
  action: z.enum(["accept", "reject"]),
  companyId: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; partyId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, partyId } = await params;

  const party = await prisma.dealParty.findUnique({
    where: { id: partyId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!party || party.dealId !== id) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  if (party.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the invited user can accept or reject" },
      { status: 403 }
    );
  }

  if (party.status !== "invited") {
    return NextResponse.json(
      { error: `Cannot update party with status "${party.status}"` },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { action, companyId } = updatePartySchema.parse(body);

    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company || company.userId !== session.user.id) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
    }

    if (action === "accept") {
      const updated = await prisma.dealParty.update({
        where: { id: partyId },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
          ...(companyId && { companyId }),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await logTimelineEvent({
        dealId: id,
        userId: session.user.id,
        eventType: "party_accepted",
        description: `${party.user.name} accepted the invitation as ${party.role.replace("_", " ")}`,
        metadata: { partyId, role: party.role },
      });

      return NextResponse.json(updated);
    } else {
      const updated = await prisma.dealParty.update({
        where: { id: partyId },
        data: { status: "rejected" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await logTimelineEvent({
        dealId: id,
        userId: session.user.id,
        eventType: "party_invited",
        description: `${party.user.name} rejected the invitation as ${party.role.replace("_", " ")}`,
        metadata: { partyId, role: party.role, action: "rejected" },
      });

      return NextResponse.json(updated);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update party" }, { status: 500 });
  }
}
