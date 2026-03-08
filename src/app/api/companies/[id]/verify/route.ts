import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// POST /api/companies/[id]/verify — Submit a verification request
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
  if (company.userId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  if (company.verified) {
    return NextResponse.json({ error: "Company already verified" }, { status: 400 });
  }

  // Check for existing pending request
  const existing = await prisma.verificationRequest.findFirst({
    where: { companyId: id, status: "pending" },
  });
  if (existing) {
    return NextResponse.json({ error: "Verification request already pending" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const documentIds = body.documentIds || "";

  const request = await prisma.verificationRequest.create({
    data: {
      companyId: id,
      documentIds,
      status: "pending",
    },
  });

  return NextResponse.json(request, { status: 201 });
}

// GET /api/companies/[id]/verify — Get verification status
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const requests = await prisma.verificationRequest.findMany({
    where: { companyId: id },
    orderBy: { requestedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    verified: company.verified,
    verifiedAt: company.verifiedAt,
    requests,
  });
}
