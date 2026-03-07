import { prisma } from "@/lib/db";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyDealParties({
  dealId,
  excludeUserId,
  type,
  title,
  message,
  link,
}: {
  dealId: string;
  excludeUserId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const parties = await prisma.dealParty.findMany({
    where: { dealId },
    select: { userId: true },
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { creatorId: true },
  });

  const userIds = new Set(parties.map((p) => p.userId));
  if (deal) userIds.add(deal.creatorId);
  if (excludeUserId) userIds.delete(excludeUserId);

  const notifications = [...userIds].map((userId) => ({
    userId,
    type,
    title,
    message,
    link: link || `/deals/${dealId}`,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}
