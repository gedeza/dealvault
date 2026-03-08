import { NextResponse } from "next/server";
import { getUserLimits, getUserTier } from "@/services/billing.service";
import type { TierLimits, SubscriptionTier } from "@/services/billing.service";
import { prisma } from "@/lib/db";

const TIER_NAMES: Record<SubscriptionTier, string> = {
  prospect: "Prospect",
  reef: "Reef",
  sovereign: "Sovereign",
  vault: "Vault",
};

function tierUpgradeResponse(feature: string, requiredTier: string) {
  return NextResponse.json(
    {
      error: `${feature} requires ${requiredTier} tier or higher. Upgrade your plan to access this feature.`,
      upgradeRequired: true,
      requiredTier,
    },
    { status: 403 }
  );
}

/** Check a boolean feature gate. Returns a 403 response if blocked, null if allowed. */
export async function checkFeatureGate(
  userId: string,
  feature: keyof TierLimits,
  featureLabel: string,
  requiredTier: SubscriptionTier
): Promise<NextResponse | null> {
  const limits = await getUserLimits(userId);
  if (!limits[feature]) {
    return tierUpgradeResponse(featureLabel, TIER_NAMES[requiredTier]);
  }
  return null;
}

/** Check active deal count against tier limit. */
export async function checkDealLimit(userId: string): Promise<NextResponse | null> {
  const limits = await getUserLimits(userId);
  const activeDeals = await prisma.deal.count({
    where: { creatorId: userId, status: { notIn: ["completed", "cancelled"] } },
  });
  if (activeDeals >= limits.maxActiveDeals) {
    const tier = await getUserTier(userId);
    return NextResponse.json(
      {
        error: `Active deal limit reached (${limits.maxActiveDeals}). Upgrade your plan to create more deals.`,
        upgradeRequired: true,
        currentTier: TIER_NAMES[tier],
        limit: limits.maxActiveDeals,
      },
      { status: 403 }
    );
  }
  return null;
}

/** Check deal value against tier cap. */
export async function checkDealValueCap(userId: string, value: number): Promise<NextResponse | null> {
  const limits = await getUserLimits(userId);
  if (limits.dealValueCap !== null && value > limits.dealValueCap) {
    const tier = await getUserTier(userId);
    const capFormatted = `$${(limits.dealValueCap / 1_000_000).toFixed(0)}M`;
    return NextResponse.json(
      {
        error: `Deal value exceeds your tier cap of ${capFormatted}. Upgrade to handle higher-value deals.`,
        upgradeRequired: true,
        currentTier: TIER_NAMES[tier],
        dealValueCap: limits.dealValueCap,
      },
      { status: 403 }
    );
  }
  return null;
}

/** Check party count against tier limit. */
export async function checkPartyLimit(userId: string, dealId: string): Promise<NextResponse | null> {
  const limits = await getUserLimits(userId);
  const partyCount = await prisma.dealParty.count({ where: { dealId } });
  if (partyCount >= limits.maxPartiesPerDeal) {
    return NextResponse.json(
      {
        error: `Party limit reached (${limits.maxPartiesPerDeal}). Upgrade to add more parties.`,
        upgradeRequired: true,
        limit: limits.maxPartiesPerDeal,
      },
      { status: 403 }
    );
  }
  return null;
}

/** Check storage usage against tier limit. */
export async function checkStorageLimit(userId: string, newFileSize: number): Promise<NextResponse | null> {
  const limits = await getUserLimits(userId);
  const result = await prisma.document.aggregate({
    where: { deal: { creatorId: userId } },
    _sum: { fileSize: true },
  });
  const currentBytes = result._sum.fileSize || 0;
  const limitBytes = limits.storageGB * 1024 * 1024 * 1024;
  if (currentBytes + newFileSize > limitBytes) {
    return NextResponse.json(
      {
        error: `Storage limit reached (${limits.storageGB} GB). Upgrade for more storage.`,
        upgradeRequired: true,
        limit: limits.storageGB,
      },
      { status: 403 }
    );
  }
  return null;
}
