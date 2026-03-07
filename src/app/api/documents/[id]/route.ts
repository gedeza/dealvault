import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getFilePath } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      deal: {
        include: { parties: true },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const deal = document.deal;
  const userParty = deal.parties.find((p) => p.userId === session.user.id);
  const isCreator = deal.creatorId === session.user.id;

  if (!userParty && !isCreator) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Enforce visibility
  if (document.visibility === "private" && document.uploaderId !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (document.visibility === "side" && userParty) {
    const uploaderParty = deal.parties.find((p) => p.userId === document.uploaderId);
    if (uploaderParty && uploaderParty.side !== userParty.side && document.uploaderId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const resolvedPath = await getFilePath(document.filePath);
  if (!resolvedPath) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const fileBuffer = await readFile(resolvedPath);
  const safeFilename = path.basename(document.name).replace(/[^\w.\-]/g, "_");

  // Support inline preview for images and PDFs (when no ?download param)
  const { searchParams } = new URL(req.url);
  const forceDownload = searchParams.has("download");
  const isPreviewable = document.mimeType.startsWith("image/") || document.mimeType === "application/pdf";
  const disposition = (!forceDownload && isPreviewable)
    ? `inline; filename="${safeFilename}"`
    : `attachment; filename="${safeFilename}"`;

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": disposition,
      "Content-Length": String(fileBuffer.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
