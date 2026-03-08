"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const HIGH_VALUE_THRESHOLD = 1_000_000;

const USD_RATES: Record<string, number> = {
  USD: 1,
  ZAR: 0.055,
  EUR: 1.08,
  GBP: 1.26,
  CHF: 1.12,
  AUD: 0.65,
  CAD: 0.74,
  JPY: 0.0067,
  CNY: 0.14,
};

interface TwoFactorBadgeProps {
  dealValue: number;
  currency: string;
  verified?: boolean;
}

/**
 * Displays a 2FA security badge for deals above the high-value threshold.
 * Shows "2FA Verified" (green) or "2FA Required" (amber) based on deal status.
 * Returns null for deals below the threshold.
 */
export function TwoFactorBadge({ dealValue, currency, verified }: TwoFactorBadgeProps) {
  const rate = USD_RATES[currency.toUpperCase()] ?? 1;
  const usdEquivalent = dealValue * rate;

  if (usdEquivalent < HIGH_VALUE_THRESHOLD) {
    return null;
  }

  if (verified) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
      >
        <ShieldCheck className="h-3 w-3" />
        2FA Verified
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
    >
      <ShieldAlert className="h-3 w-3" />
      2FA Required
    </Badge>
  );
}
