import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

async function enhanceMessage(dealId: string, type: string, rawMessage: string): Promise<string> {
  try {
    const { generateSmartNotification } = await import("@/services/ai.service");
    return await generateSmartNotification({
      dealId,
      eventType: type,
      rawDetail: rawMessage,
    });
  } catch {
    logger.warn("[Notification] AI enhancement unavailable, using raw message");
    return rawMessage;
  }
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  dealId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  dealId?: string;
}) {
  const enhancedMessage = dealId
    ? await enhanceMessage(dealId, type, message)
    : message;

  return prisma.notification.create({
    data: { userId, type, title, message: enhancedMessage, link },
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
  // Enhance message with AI (fire-and-forget friendly — falls back to raw)
  const enhancedMessage = await enhanceMessage(dealId, type, message);

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
    message: enhancedMessage,
    link: link || `/deals/${dealId}`,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}
