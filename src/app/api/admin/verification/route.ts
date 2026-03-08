import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { createNotification } from "@/services/notification.service";

// GET /api/admin/verification — List pending verification requests
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const requests = await prisma.verificationRequest.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      company: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json(requests);
}

// POST /api/admin/verification — Approve or reject a verification request
export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { requestId, action, reviewNotes } = body;

  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "requestId and action (approve|reject) required" },
      { status: 400 }
    );
  }

  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: { company: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request already reviewed" }, { status: 400 });
  }

  const approved = action === "approve";

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: approved ? "approved" : "rejected",
        reviewedByUserId: session!.user.id,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
      },
    }),
    ...(approved
      ? [
          prisma.company.update({
            where: { id: request.companyId },
            data: { verified: true, verifiedAt: new Date() },
          }),
          // Propagate verification to all deal parties using this company
          prisma.dealParty.updateMany({
            where: { companyId: request.companyId, verifiedAt: null },
            data: { verifiedAt: new Date() },
          }),
        ]
      : []),
  ]);

  // Notify company owner
  await createNotification({
    userId: request.company.userId,
    type: approved ? "company_verified" : "company_rejected",
    title: approved ? "Company Verified" : "Verification Rejected",
    message: approved
      ? `Your company "${request.company.name}" has been verified.`
      : `Verification for "${request.company.name}" was rejected. ${reviewNotes || ""}`,
    link: "/companies",
  });

  return NextResponse.json({
    status: approved ? "approved" : "rejected",
    companyId: request.companyId,
  });
}
