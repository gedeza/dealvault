import { prisma } from "@/lib/db";

export async function logTimelineEvent({
  dealId,
  userId,
  eventType,
  description,
  metadata,
}: {
  dealId: string;
  userId: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.dealTimeline.create({
    data: {
      dealId,
      userId,
      eventType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
