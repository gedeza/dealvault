import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { saveFile, validateFile, validateFileBytes } from "@/lib/storage";
import { logTimelineEvent } from "@/services/timeline.service";
import { broadcastToDeal } from "@/lib/sse";
import { sendDealEventEmail } from "@/services/email.service";
import { analyzeDocument } from "@/services/document-intelligence.service";
import { logger } from "@/lib/logger";
import { checkStorageLimit } from "@/lib/tier-guard";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId") as string;
    const type = formData.get("type") as string;
    const visibility = (formData.get("visibility") as string) || "deal";

    if (!file || !dealId || !type) {
      return NextResponse.json(
        { error: "File, dealId, and type are required" },
        { status: 400 }
      );
    }

    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Server-side magic byte validation
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const bytesError = validateFileBytes(fileBuffer, ext);
    if (bytesError) {
      return NextResponse.json({ error: bytesError }, { status: 400 });
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const party = await prisma.dealParty.findUnique({
      where: { dealId_userId: { dealId, userId: session.user.id } },
    });
    if (!party && deal.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const storageBlock = await checkStorageLimit(session.user.id, file.size);
    if (storageBlock) return storageBlock;

    const { filePath, sha256Hash, fileSize } = await saveFile(file, dealId, fileBuffer);

    const document = await prisma.document.create({
      data: {
        name: file.name,
        type,
        filePath,
        fileSize,
        mimeType: file.type || "application/octet-stream",
        sha256Hash,
        visibility,
        dealId,
        uploaderId: session.user.id,
      },
    });

    await logTimelineEvent({
      dealId,
      userId: session.user.id,
      eventType: "document_uploaded",
      description: `Document "${file.name}" (${type}) uploaded`,
      metadata: { documentId: document.id, type, sha256Hash },
    });

    // SSE: broadcast document upload to deal room
    broadcastToDeal(dealId, "document_uploaded", {
      documentId: document.id,
      name: file.name,
      type,
      uploadedBy: session.user.name,
    }, session.user.id);

    // Email: notify deal parties
    sendDealEventEmail({
      dealId,
      excludeUserId: session.user.id,
      eventType: "document_uploaded",
      dealTitle: deal.title,
      dealNumber: deal.dealNumber,
      actorName: session.user.name || "A deal member",
      detail: `Uploaded document "${file.name}" (${type})`,
    });

    // AI + OCR: analyze document in background (non-blocking)
    if (process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const parties = await prisma.dealParty.findMany({
        where: { dealId },
        include: { user: { select: { name: true } } },
      });
      analyzeDocument({
        filePath,
        documentName: file.name,
        documentType: type,
        dealCommodity: deal.commodity,
        dealTitle: deal.title,
        existingParties: parties.map((p) => p.user.name || "Unknown"),
      })
        .then((result) => {
          logger.info("[DocIntel] Document analyzed", {
            documentId: document.id,
            fields: result.extractedFields,
            confidence: result.confidence,
            hasOcr: !!result.ocrText,
          });
        })
        .catch((err) => {
          logger.error("[DocIntel] Document analysis failed", { error: String(err) });
        });
    }

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
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

  const documents = await prisma.document.findMany({
    where: { dealId },
    include: {
      uploader: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const userSide = userParty?.side;
  const filtered = documents.filter((doc) => {
    if (doc.visibility === "deal") return true;
    if (doc.visibility === "private") return doc.uploaderId === session.user.id;
    if (doc.visibility === "side" && userSide) {
      return doc.uploaderId === session.user.id ||
        deal.parties.some(
          (p) => p.userId === doc.uploaderId && p.side === userSide
        );
    }
    return false;
  });

  return NextResponse.json(filtered);
}
