import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
}

// In-memory rate limiting for Edge Runtime
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Periodic cleanup (runs lazily)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, value] of rateMap) {
    if (value.resetAt < now) rateMap.delete(key);
  }
}

export function proxy(req: NextRequest) {
  cleanup();

  const { pathname } = req.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);

  // NextAuth session checks happen frequently — don't rate limit them
  const isSessionCheck = pathname === "/api/auth/session" || pathname.startsWith("/api/auth/callback");
  if (isSessionCheck) {
    return NextResponse.next();
  }

  // Stricter limits for auth mutation endpoints (login, register, reset)
  const isAuthMutation = pathname.startsWith("/api/auth/") && req.method === "POST";
  const bucket = isAuthMutation ? "auth" : "api";
  const maxRequests = isAuthMutation ? 10 : 200;
  const windowMs = isAuthMutation ? 15 * 60 * 1000 : 60 * 1000;

  // Even stricter for uploads
  const isUpload = pathname === "/api/documents" && req.method === "POST";
  const key = `${isUpload ? "upload" : bucket}:${ip}`;
  const limit = isUpload ? 10 : maxRequests;
  const window = isUpload ? 60_000 : windowMs;

  const result = checkRateLimit(key, limit, window);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
