import { jwtVerify } from "jose";
import { env } from "./env";
import { toUSDEquivalent } from "./currency";

export const HIGH_VALUE_THRESHOLD = 1_000_000; // $1M USD

export function requiresTwoFactor(dealValue: number, currency: string): boolean {
  const usdValue = toUSDEquivalent(dealValue, currency);
  return usdValue >= HIGH_VALUE_THRESHOLD;
}

export async function verify2FAToken(token: string): Promise<{ valid: boolean; userId: string }> {
  try {
    const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "2fa-verify" || typeof payload.userId !== "string") {
      return { valid: false, userId: "" };
    }
    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false, userId: "" };
  }
}
