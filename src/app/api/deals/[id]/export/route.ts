import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

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
  const format = searchParams.get("format");

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      parties: { select: { userId: true } },
      timeline: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
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

  const timelineData = deal.timeline.map((t) => ({
    timestamp: t.createdAt.toISOString(),
    eventType: t.eventType,
    description: t.description,
    user: t.user.name,
    metadata: t.metadata || "",
  }));

  if (format === "csv") {
    const lines: string[] = [];

    lines.push("Timestamp,Event Type,Description,User,Metadata");
    for (const t of timelineData) {
      lines.push(
        [
          csvEscape(t.timestamp),
          csvEscape(t.eventType),
          csvEscape(t.description),
          csvEscape(t.user),
          csvEscape(t.metadata),
        ].join(",")
      );
    }

    const csv = lines.join("\n");
    const filename = `${deal.dealNumber}_audit_log.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Default to JSON
  const filename = `${deal.dealNumber}_audit_log.json`;
  return new Response(JSON.stringify(timelineData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
