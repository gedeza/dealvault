/**
 * Cloudflare R2 Object Storage integration.
 *
 * Uses S3-compatible API. Falls back to local filesystem when R2 is not configured.
 * Environment variables:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { logger } from "@/lib/logger";

let s3Client: S3Client | null = null;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function getClient(): S3Client | null {
  if (s3Client) return s3Client;

  const config = getR2Config();
  if (!config) return null;

  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3Client;
}

export function isR2Enabled(): boolean {
  return getR2Config() !== null;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ url: string; sha256Hash: string; fileSize: number }> {
  const client = getClient();
  const config = getR2Config();

  if (!client || !config) {
    throw new Error("R2 is not configured");
  }

  const sha256Hash = createHash("sha256").update(buffer).digest("hex");

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ChecksumSHA256: Buffer.from(sha256Hash, "hex").toString("base64"),
    })
  );

  const publicUrl = process.env.R2_PUBLIC_URL;
  const url = publicUrl ? `${publicUrl}/${key}` : key;

  logger.info("[R2] File uploaded", { key, size: buffer.length });

  return { url, sha256Hash, fileSize: buffer.length };
}

export async function downloadFromR2(key: string): Promise<Buffer | null> {
  const client = getClient();
  const config = getR2Config();

  if (!client || !config) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );

    const stream = response.Body;
    if (!stream) return null;

    const chunks: Uint8Array[] = [];
    // @ts-expect-error - stream is async iterable in Node
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    logger.error("[R2] Download failed", { key });
    return null;
  }
}

export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getClient();
  const config = getR2Config();

  if (!client || !config) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
    return true;
  } catch {
    logger.error("[R2] Delete failed", { key });
    return false;
  }
}
