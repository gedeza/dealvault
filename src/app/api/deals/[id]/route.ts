import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";
import { VALID_STATUS_TRANSITIONS, DEAL_STATUS_LABELS, type DealStatus } from "@/types";
import { notifyDealParties } from "@/services/notification.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const messageLimit = Math.min(100, Math.max(1, parseInt(searchParams.get("messageLimit") || "50")));
  const messagePage = Math.max(1, parseInt(searchParams.get("messagePage") || "1"));
  const timelineLimit = Math.min(100, Math.max(1, parseInt(searchParams.get("timelineLimit") || "50")));
  const timelinePage = Math.max(1, parseInt(searchParams.get("timelinePage") || "1"));

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      parties: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          company: true,
        },
      },
      documents: {
        include: {
          uploader: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      timeline: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: timelineLimit,
        skip: (timelinePage - 1) * timelineLimit,
      },
      messages: {
        include: {
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: messageLimit,
        skip: (messagePage - 1) * messageLimit,
      },
      commissionLedger: {
        include: {
          party: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
      _count: {
        select: { messages: true, timeline: true },
      },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Check access
  const hasAccess =
    deal.creatorId === session.user.id ||
    deal.parties.some((p) => p.userId === session.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Filter messages and documents by visibility
  const userParty = deal.parties.find((p) => p.userId === session.user.id);
  const userSide = userParty?.side;

  const filteredMessages = deal.messages.filter((msg) => {
    if (msg.visibility === "deal") return true;
    if (msg.visibility === "private") return msg.senderId === session.user.id;
    if (msg.visibility === "side" && userSide) {
      return msg.senderId === session.user.id ||
        deal.parties.some((p) => p.userId === msg.senderId && p.side === userSide);
    }
    return false;
  });

  const filteredDocuments = deal.documents.filter((doc) => {
    if (doc.visibility === "deal") return true;
    if (doc.visibility === "private") return doc.uploaderId === session.user.id;
    if (doc.visibility === "side" && userSide) {
      return doc.uploaderId === session.user.id ||
        deal.parties.some((p) => p.userId === doc.uploaderId && p.side === userSide);
    }
    return false;
  });

  return NextResponse.json({
    ...deal,
    messages: filteredMessages,
    documents: filteredDocuments,
    pagination: {
      messages: {
        page: messagePage,
        limit: messageLimit,
        total: deal._count.messages,
        totalPages: Math.ceil(deal._count.messages / messageLimit),
      },
      timeline: {
        page: timelinePage,
        limit: timelineLimit,
        total: deal._count.timeline,
        totalPages: Math.ceil(deal._count.timeline / timelineLimit),
      },
    },
  });
}

const updateDealSchema = z.object({
  status: z
    .enum([
      "draft",
      "documents_pending",
      "under_review",
      "verified",
      "in_progress",
      "settled",
      "closed",
      "cancelled",
    ])
    .optional(),
  title: z.string().min(3).optional(),
  commissionPool: z.number().min(0).max(1).optional(),
});

export async function PATCH(
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
    return NextResponse.json({ error: "Only deal creator can update" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateDealSchema.parse(body);

    if (data.status) {
      const currentStatus = deal.status as DealStatus;
      const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(data.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${currentStatus}" to "${data.status}". Allowed: ${allowed?.join(", ") || "none"}`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.deal.update({
      where: { id },
      data,
    });

    if (data.status) {
      await logTimelineEvent({
        dealId: id,
        userId: session.user.id,
        eventType: "status_changed",
        description: `Deal status changed from "${deal.status}" to "${data.status}"`,
        metadata: { from: deal.status, to: data.status },
      });

      await notifyDealParties({
        dealId: id,
        excludeUserId: session.user.id,
        type: "status_changed",
        title: "Deal Status Updated",
        message: `"${deal.title}" is now ${DEAL_STATUS_LABELS[data.status] || data.status}`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}
