import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { validateFile, validateFileBytes, saveFile } from "@/lib/storage";
import { getUserWorkflowRole } from "@/services/workflow.service";
import path from "path";

// POST /api/deals/[id]/custody/checkpoints/[checkpointId]/photo — Upload checkpoint photo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; checkpointId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, checkpointId } = await params;

  // Verify user is a deal party
  const role = await getUserWorkflowRole(session.user.id, id);
  if (!role) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Verify checkpoint exists and belongs to this deal
  const checkpoint = await prisma.custodyCheckpoint.findUnique({
    where: { id: checkpointId },
    include: { custodyLog: true },
  });

  if (!checkpoint) {
    return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
  }

  if (checkpoint.custodyLog.dealId !== id) {
    return NextResponse.json({ error: "Checkpoint does not belong to this deal" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Only allow image types for custody photos
    const ext = path.extname(file.name).toLowerCase();
    const allowedPhotoExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedPhotoExts.includes(ext)) {
      return NextResponse.json(
        { error: `Only image files allowed (${allowedPhotoExts.join(", ")})` },
        { status: 400 }
      );
    }

    // Validate file size and type
    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Validate magic bytes
    const buffer = Buffer.from(await file.arrayBuffer());
    const bytesError = validateFileBytes(buffer, ext);
    if (bytesError) {
      return NextResponse.json({ error: bytesError }, { status: 400 });
    }

    // Save file under uploads/{dealId}/custody/
    const result = await saveFile(file, `${id}/custody`, buffer);

    // Update checkpoint with photo info
    await prisma.custodyCheckpoint.update({
      where: { id: checkpointId },
      data: {
        photoPath: result.filePath,
        photoHash: result.sha256Hash,
      },
    });

    return NextResponse.json({
      photoPath: result.filePath,
      photoHash: result.sha256Hash,
      fileSize: result.fileSize,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
