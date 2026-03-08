import { createHash } from "crypto";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { isR2Enabled, uploadToR2 } from "@/lib/cloud-storage";
import { logger } from "@/lib/logger";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".webp",
  ".doc", ".docx", ".xls", ".xlsx",
  ".txt", ".csv",
  ".mp4", ".mov", ".webm",
]);

// Magic byte signatures for server-side MIME validation
const MAGIC_BYTES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF + WEBP at offset 8
  { mime: "application/msword", bytes: [0xD0, 0xCF, 0x11, 0xE0] }, // OLE2 (doc/xls)
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: [0x50, 0x4B, 0x03, 0x04] }, // ZIP (docx/xlsx)
  { mime: "video/mp4", bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp box (offset 4 = "ftyp")
  { mime: "video/webm", bytes: [0x1A, 0x45, 0xDF, 0xA3] }, // EBML/WebM
];

function detectMimeFromBytes(buffer: Buffer): string | null {
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (match) {
      // For WEBP, verify "WEBP" at offset 8
      if (sig.mime === "image/webp") {
        if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
          return "image/webp";
        }
        continue;
      }
      // For MP4/MOV, verify "ftyp" at offset 4
      if (sig.mime === "video/mp4") {
        if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
          return "video/mp4";
        }
        continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`;
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `File type "${ext}" not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`;
  }

  const mimeType = file.type || "application/octet-stream";
  if (mimeType !== "application/octet-stream" && !ALLOWED_MIME_TYPES.has(mimeType)) {
    return `MIME type "${mimeType}" not allowed`;
  }

  return null;
}

export function validateFileBytes(buffer: Buffer, ext: string): string | null {
  // Text files (.txt, .csv) don't have magic bytes — skip validation
  if ([".txt", ".csv"].includes(ext)) return null;

  const detected = detectMimeFromBytes(buffer);
  if (!detected) {
    return "File content does not match any allowed file type";
  }

  // ZIP-based formats (docx, xlsx) share the same magic bytes — allow either extension
  const zipExts = new Set([".docx", ".xlsx"]);
  const oleExts = new Set([".doc", ".xls"]);
  if (detected.startsWith("application/vnd.openxmlformats") && zipExts.has(ext)) return null;
  if (detected === "application/msword" && oleExts.has(ext)) return null;

  // For other types, verify the extension matches the detected MIME
  const mimeToExt: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "video/mp4": [".mp4", ".mov"],
    "video/webm": [".webm"],
  };

  const expectedExts = mimeToExt[detected];
  if (expectedExts && !expectedExts.includes(ext)) {
    return `File content (${detected}) does not match extension "${ext}"`;
  }

  return null;
}

export async function saveFile(
  file: File,
  dealId: string,
  preloadedBuffer?: Buffer
): Promise<{ filePath: string; sha256Hash: string; fileSize: number }> {
  const buffer = preloadedBuffer ?? Buffer.from(await file.arrayBuffer());
  const sha256Hash = createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(file.name).toLowerCase();
  const fileName = `${sha256Hash}${ext}`;

  // Use R2 cloud storage when configured
  if (isR2Enabled()) {
    try {
      const key = `${dealId}/${fileName}`;
      const contentType = file.type || "application/octet-stream";
      const result = await uploadToR2(buffer, key, contentType);
      return {
        filePath: result.url,
        sha256Hash: result.sha256Hash,
        fileSize: result.fileSize,
      };
    } catch (err) {
      logger.error("[Storage] R2 upload failed, falling back to local", { error: String(err) });
    }
  }

  // Local filesystem fallback
  const dealDir = path.join(UPLOAD_DIR, dealId);
  await mkdir(dealDir, { recursive: true });
  const filePath = path.join(dealDir, fileName);
  await writeFile(filePath, buffer);

  return {
    filePath: `uploads/${dealId}/${fileName}`,
    sha256Hash,
    fileSize: buffer.length,
  };
}

export async function getFilePath(storedPath: string): Promise<string | null> {
  const fullPath = path.join(process.cwd(), storedPath);
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    return null;
  }
  try {
    await readFile(resolved);
    return resolved;
  } catch {
    return null;
  }
}
