import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { validateFile, validateFileBytes, saveFile } from "@/lib/storage";
import { getUserWorkflowRole } from "@/services/workflow.service";
import { checkFeatureGate } from "@/lib/tier-guard";
import path from "path";

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_VIDEO_EXTS = [".mp4", ".mov", ".webm"];
const ALLOWED_EVIDENCE_EXTS = [...ALLOWED_IMAGE_EXTS, ...ALLOWED_VIDEO_EXTS];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB for video

// POST /api/deals/[id]/custody/checkpoints/[checkpointId]/photo — Upload checkpoint photo or video evidence
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; checkpointId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, checkpointId } = await params;

    const gate = await checkFeatureGate(session.user.id, "chainOfCustody", "Chain of Custody", "sovereign");
    if (gate) return gate;

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

    const ext = path.extname(file.name).toLowerCase();
    const isVideo = ALLOWED_VIDEO_EXTS.includes(ext);

    if (!ALLOWED_EVIDENCE_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: `Only image and video files allowed (${ALLOWED_EVIDENCE_EXTS.join(", ")})` },
        { status: 400 }
      );
    }

    // Video files get a higher size limit
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video files must be under ${MAX_VIDEO_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Validate file size and type (uses default 25MB limit for images)
    if (!isVideo) {
      const validationError = validateFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    // Validate magic bytes
    const buffer = Buffer.from(await file.arrayBuffer());
    const bytesError = validateFileBytes(buffer, ext);
    if (bytesError) {
      return NextResponse.json({ error: bytesError }, { status: 400 });
    }

    // Save file under uploads/{dealId}/custody/
    const result = await saveFile(file, `${id}/custody`, buffer);

    // Update checkpoint with photo or video info
    if (isVideo) {
      await prisma.custodyCheckpoint.update({
        where: { id: checkpointId },
        data: {
          videoPath: result.filePath,
          videoHash: result.sha256Hash,
        },
      });

      return NextResponse.json({
        videoPath: result.filePath,
        videoHash: result.sha256Hash,
        fileSize: result.fileSize,
        type: "video",
      }, { status: 201 });
    } else {
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
        type: "photo",
      }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}
