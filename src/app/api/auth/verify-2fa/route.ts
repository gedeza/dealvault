import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as OTPAuth from "otpauth";
import { SignJWT } from "jose";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(ip, "auth");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string" || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
  }

  // Replay prevention
  const alreadyUsed = await prisma.usedTotpCode.findUnique({
    where: { userId_code: { userId: session.user.id, code } },
  });
  if (alreadyUsed) {
    return NextResponse.json({ error: "Code already used" }, { status: 400 });
  }
  await prisma.usedTotpCode.create({
    data: { userId: session.user.id, code },
  });

  // Cleanup old codes
  await prisma.usedTotpCode.deleteMany({
    where: {
      userId: session.user.id,
      usedAt: { lt: new Date(Date.now() - 2 * 60 * 1000) },
    },
  });

  // Sign a short-lived verification token (5 min)
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
  const token = await new SignJWT({ userId: session.user.id, purpose: "2fa-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .setIssuedAt()
    .sign(secret);

  return NextResponse.json({ token });
}
