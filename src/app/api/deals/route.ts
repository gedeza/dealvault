import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logTimelineEvent } from "@/services/timeline.service";
import { sanitizeObject } from "@/lib/sanitize";
import { requiresTwoFactor, verify2FAToken } from "@/lib/two-factor-gate";

const createDealSchema = z.object({
  title: z.string().min(3),
  commodity: z.enum(["gold", "diamonds", "platinum", "tanzanite"]),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  value: z.number().positive(),
  currency: z.string().default("USD"),
  commissionPool: z.number().min(0).max(1).default(0.02),
});

async function generateDealNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.deal.count({
    where: {
      dealNumber: { startsWith: `DV-${year}` },
    },
  });
  return `DV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const commodity = searchParams.get("commodity") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const baseWhere = {
    OR: [
      { creatorId: session.user.id },
      { parties: { some: { userId: session.user.id } } },
    ],
  };

  const filters: Record<string, unknown>[] = [];
  if (search) {
    filters.push({
      OR: [
        { title: { contains: search } },
        { dealNumber: { contains: search } },
      ],
    });
  }
  if (status) filters.push({ status });
  if (commodity) filters.push({ commodity });

  const where = filters.length > 0
    ? { AND: [baseWhere, ...filters] }
    : baseWhere;

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        parties: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { documents: true, messages: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deal.count({ where }),
  ]);

  return NextResponse.json({
    deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createDealSchema.parse(sanitizeObject(body));

    // Enforce 2FA for high-value deals
    if (requiresTwoFactor(data.value, data.currency)) {
      const tfaToken = req.headers.get("X-2FA-Token");
      if (!tfaToken) {
        return NextResponse.json(
          { error: "Two-factor authentication is required for high-value deals" },
          { status: 403 }
        );
      }

      const verification = await verify2FAToken(tfaToken);
      if (!verification.valid) {
        return NextResponse.json(
          { error: "Invalid or expired 2FA verification token" },
          { status: 403 }
        );
      }

      // Ensure the token belongs to the authenticated user
      if (verification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "2FA token does not match authenticated user" },
          { status: 403 }
        );
      }
    }

    // Use transaction to prevent deal number race condition
    const deal = await prisma.$transaction(async (tx) => {
      const dealNumber = await generateDealNumber();

      return tx.deal.create({
        data: {
          dealNumber,
          title: data.title,
          commodity: data.commodity,
          quantity: data.quantity,
          unit: data.unit,
          value: data.value,
          currency: data.currency,
          commissionPool: data.commissionPool,
          creatorId: session.user.id,
          parties: {
            create: {
              userId: session.user.id,
              role: "seller",
              side: "sell",
              positionInChain: 0,
              status: "accepted",
              acceptedAt: new Date(),
            },
          },
        },
        include: {
          parties: true,
        },
      });
    });

    await logTimelineEvent({
      dealId: deal.id,
      userId: session.user.id,
      eventType: "deal_created",
      description: `Deal room "${deal.title}" (${deal.dealNumber}) created`,
      metadata: { commodity: deal.commodity, value: deal.value, currency: deal.currency },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
