import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkFeatureGate } from "@/lib/tier-guard";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = await checkFeatureGate(session.user.id, "advancedReporting", "Advanced Reporting", "reef");
  if (gate) return gate;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "12m";

  const now = new Date();
  let startDate: Date;
  switch (range) {
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6m":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case "all":
      startDate = new Date(2020, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  }

  const userFilter = {
    OR: [
      { creatorId: session.user.id },
      { parties: { some: { userId: session.user.id } } },
    ],
  };

  const deals = await prisma.deal.findMany({
    where: { ...userFilter, createdAt: { gte: startDate } },
    include: {
      parties: { select: { role: true, commissionPct: true, user: { select: { name: true } } } },
      commissionLedger: { select: { calculatedAmount: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Monthly volume & value trend
  const monthlyMap = new Map<string, { volume: number; value: number; commissions: number }>();
  for (const deal of deals) {
    const key = `${deal.createdAt.getFullYear()}-${String(deal.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key) || { volume: 0, value: 0, commissions: 0 };
    entry.volume++;
    entry.value += deal.value;
    for (const c of deal.commissionLedger) {
      entry.commissions += c.calculatedAmount;
    }
    monthlyMap.set(key, entry);
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Commodity distribution
  const commodityMap = new Map<string, { count: number; value: number }>();
  for (const deal of deals) {
    const entry = commodityMap.get(deal.commodity) || { count: 0, value: 0 };
    entry.count++;
    entry.value += deal.value;
    commodityMap.set(deal.commodity, entry);
  }
  const commodityDistribution = Array.from(commodityMap.entries()).map(([commodity, data]) => ({
    commodity,
    ...data,
  }));

  // Status distribution
  const statusMap = new Map<string, number>();
  for (const deal of deals) {
    statusMap.set(deal.status, (statusMap.get(deal.status) || 0) + 1);
  }
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Top parties by deal count
  const partyMap = new Map<string, { name: string; dealCount: number; roles: Set<string> }>();
  for (const deal of deals) {
    for (const party of deal.parties) {
      const entry = partyMap.get(party.user.name) || { name: party.user.name, dealCount: 0, roles: new Set() };
      entry.dealCount++;
      entry.roles.add(party.role);
      partyMap.set(party.user.name, entry);
    }
  }
  const topParties = Array.from(partyMap.values())
    .map((p) => ({ name: p.name, dealCount: p.dealCount, roles: Array.from(p.roles) }))
    .sort((a, b) => b.dealCount - a.dealCount)
    .slice(0, 10);

  // Deal size distribution (histogram buckets)
  const buckets = [
    { label: "< $100K", min: 0, max: 100_000 },
    { label: "$100K-$500K", min: 100_000, max: 500_000 },
    { label: "$500K-$1M", min: 500_000, max: 1_000_000 },
    { label: "$1M-$5M", min: 1_000_000, max: 5_000_000 },
    { label: "$5M-$10M", min: 5_000_000, max: 10_000_000 },
    { label: "$10M+", min: 10_000_000, max: Infinity },
  ];
  const sizeDistribution = buckets.map((b) => ({
    label: b.label,
    count: deals.filter((d) => d.value >= b.min && d.value < b.max).length,
  }));

  // Summary stats
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const totalCommissions = deals.reduce(
    (sum, d) => sum + d.commissionLedger.reduce((s, c) => s + c.calculatedAmount, 0),
    0
  );

  return NextResponse.json({
    summary: {
      totalDeals: deals.length,
      totalValue,
      avgDealSize: deals.length > 0 ? totalValue / deals.length : 0,
      activeDeals: deals.filter((d) => !["closed", "cancelled"].includes(d.status)).length,
      totalCommissions,
    },
    monthlyTrend,
    commodityDistribution,
    statusDistribution,
    topParties,
    sizeDistribution,
  });
}
