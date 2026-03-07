import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [totalUsers, totalDeals, dealsByStatus, totalDealValue, recentDeals] =
      await Promise.all([
        prisma.user.count(),
        prisma.deal.count(),
        prisma.deal.groupBy({
          by: ["status"],
          _count: { status: true },
          orderBy: { _count: { status: "desc" } },
        }),
        prisma.deal.aggregate({
          _sum: { value: true },
        }),
        prisma.deal.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            dealNumber: true,
            title: true,
            commodity: true,
            value: true,
            currency: true,
            status: true,
            createdAt: true,
            creator: {
              select: { id: true, name: true },
            },
          },
        }),
      ]);

    return successResponse({
      totalUsers,
      totalDeals,
      dealsByStatus: dealsByStatus.map((d) => ({
        status: d.status,
        count: d._count.status,
      })),
      totalDealValue: totalDealValue._sum.value || 0,
      recentDeals,
    });
  } catch (err) {
    return handleApiError(err, "Failed to fetch admin stats");
  }
}
