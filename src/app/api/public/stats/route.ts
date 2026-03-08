import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// In-memory cache (5-minute TTL)
let cachedStats: { data: Record<string, unknown>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// GET /api/public/stats — Public platform metrics for landing page
export async function GET() {
  if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedStats.data);
  }

  try {
    const [totalDeals, totalUsers, totalValue, totalCompanies] = await Promise.all([
      prisma.deal.count(),
      prisma.user.count(),
      prisma.deal.aggregate({ _sum: { value: true } }),
      prisma.company.count(),
    ]);

    const data = {
      totalDeals,
      totalUsers,
      totalDealValue: totalValue._sum.value || 0,
      totalCompanies,
    };

    cachedStats = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { totalDeals: 0, totalUsers: 0, totalDealValue: 0, totalCompanies: 0 },
      { status: 200 }
    );
  }
}
