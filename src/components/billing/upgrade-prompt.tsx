"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUpRight } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  requiredTier: string;
  description?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, requiredTier, description, compact }: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/20">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-amber-700 dark:text-amber-300">
          {feature} requires <strong>{requiredTier}</strong> tier.
        </span>
        <Link href="/profile#billing" className="ml-auto">
          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/20">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
        <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="font-semibold text-amber-900 dark:text-amber-200">{feature}</h3>
      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto">
        {description || `This feature is available on the ${requiredTier} tier and above. Upgrade your plan to unlock it.`}
      </p>
      <Link href="/profile#billing" className="inline-block mt-4">
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          Upgrade to {requiredTier}
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
