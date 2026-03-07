import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

async function checkTotpReplay(userId: string, code: string): Promise<boolean> {
  const existing = await prisma.usedTotpCode.findUnique({
    where: { userId_code: { userId, code } },
  });
  if (existing) return true;
  await prisma.usedTotpCode.create({ data: { userId, code } });
  // Cleanup expired codes
  await prisma.usedTotpCode.deleteMany({
    where: { userId, usedAt: { lt: new Date(Date.now() - 2 * 60 * 1000) } },
  });
  return false;
}

// POST: Generate a new TOTP secret and return QR code
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled. Disable it first to reconfigure." },
      { status: 400 }
    );
  }

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "DealVault",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Store the secret (not yet enabled until verified)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret.base32 },
  });

  const uri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
    uri,
  });
}

const verifySchema = z.object({
  code: z.string().length(6),
});

// PATCH: Verify TOTP code and enable 2FA
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code } = verifySchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: "No 2FA secret found. Generate one first." },
      { status: 400 }
    );
  }

  const totp = new OTPAuth.TOTP({
    issuer: "DealVault",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (await checkTotpReplay(session.user.id, code)) {
    return NextResponse.json({ error: "Code already used. Wait for a new code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ message: "2FA enabled successfully" });
}

// DELETE: Disable 2FA
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code } = verifySchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({
    issuer: "DealVault",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (await checkTotpReplay(session.user.id, code)) {
    return NextResponse.json({ error: "Code already used. Wait for a new code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ message: "2FA disabled successfully" });
}
