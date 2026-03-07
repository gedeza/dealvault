import { prisma } from "@/lib/db";
import { logTimelineEvent } from "@/services/timeline.service";
import { notifyDealParties } from "@/services/notification.service";
import {
  DEFAULT_CUSTODY_CHECKPOINTS,
  CHECKPOINT_TYPE_LABELS,
  WEIGHT_VARIANCE_THRESHOLD,
} from "@/types/workflow";
import { getUserWorkflowRole, getUserDealSide } from "@/services/workflow.service";

// ============================================================================
// Custody Log Initiation
// ============================================================================

export async function initiateCustodyLog({
  dealId,
  userId,
  sealId,
  custodianName,
  custodianType,
  custodianContact,
}: {
  dealId: string;
  userId: string;
  sealId: string;
  custodianName?: string;
  custodianType?: string;
  custodianContact?: string;
}) {
  const role = await getUserWorkflowRole(userId, dealId);
  if (!role || !["seller", "broker", "intermediary", "seller_mandate"].includes(role)) {
    throw new Error("Only seller-side parties or intermediary can initiate custody");
  }

  const existing = await prisma.custodyLog.findUnique({
    where: { dealId },
  });

  if (existing) {
    throw new Error("Custody log already exists for this deal");
  }

  const custodyLog = await prisma.$transaction(async (tx) => {
    const log = await tx.custodyLog.create({
      data: {
        dealId,
        sealId,
        custodianName: custodianName || null,
        custodianType: custodianType || null,
        custodianContact: custodianContact || null,
      },
    });

    // Create default checkpoints
    for (const cp of DEFAULT_CUSTODY_CHECKPOINTS) {
      await tx.custodyCheckpoint.create({
        data: {
          custodyLogId: log.id,
          sequence: cp.sequence,
          checkpointType: cp.checkpointType,
          label: cp.label,
          isMandatory: cp.isMandatory,
        },
      });
    }

    return log;
  });

  await logTimelineEvent({
    dealId,
    userId,
    eventType: "custody_initiated",
    description: `Chain of custody initiated. Seal ID: ${sealId}`,
    metadata: { sealId, custodianName, custodianType },
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { title: true },
  });

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: "custody_initiated",
    title: "Chain of Custody Started",
    message: `Custody tracking initiated for "${deal?.title}" (Seal: ${sealId})`,
  });

  return custodyLog;
}

// ============================================================================
// Checkpoint Evidence Submission
// ============================================================================

export async function submitCheckpointEvidence({
  dealId,
  checkpointId,
  userId,
  data,
}: {
  dealId: string;
  checkpointId: string;
  userId: string;
  data: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    notes?: string;
    sealIntact?: boolean;
    weight?: number;
    weightUnit?: string;
    photoPath?: string;
    photoHash?: string;
    videoPath?: string;
    videoHash?: string;
  };
}) {
  const role = await getUserWorkflowRole(userId, dealId);
  if (!role) {
    throw new Error("User is not a party to this deal");
  }

  const checkpoint = await prisma.custodyCheckpoint.findUnique({
    where: { id: checkpointId },
    include: { custodyLog: true },
  });

  if (!checkpoint) {
    throw new Error("Checkpoint not found");
  }

  if (checkpoint.custodyLog.dealId !== dealId) {
    throw new Error("Checkpoint does not belong to this deal");
  }

  if (checkpoint.isComplete) {
    throw new Error("Checkpoint already completed");
  }

  const updateData: Record<string, unknown> = {
    submittedByUserId: userId,
    submittedAt: new Date(),
  };

  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.locationName !== undefined) updateData.locationName = data.locationName;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.sealIntact !== undefined) updateData.sealIntact = data.sealIntact;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.weightUnit !== undefined) updateData.weightUnit = data.weightUnit;
  if (data.photoPath !== undefined) updateData.photoPath = data.photoPath;
  if (data.photoHash !== undefined) updateData.photoHash = data.photoHash;
  if (data.videoPath !== undefined) updateData.videoPath = data.videoPath;
  if (data.videoHash !== undefined) updateData.videoHash = data.videoHash;

  const updated = await prisma.custodyCheckpoint.update({
    where: { id: checkpointId },
    data: updateData,
  });

  await logTimelineEvent({
    dealId,
    userId,
    eventType: "checkpoint_submitted",
    description: `Evidence submitted for checkpoint: ${checkpoint.label}`,
    metadata: {
      checkpointType: checkpoint.checkpointType,
      sequence: checkpoint.sequence,
      locationName: data.locationName,
      sealIntact: data.sealIntact,
      weight: data.weight,
    },
  });

  // Check weight variance against previous checkpoints
  if (data.weight !== undefined) {
    await checkWeightVariance(dealId, checkpoint.custodyLogId, checkpoint.sequence, data.weight, userId);
  }

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: "checkpoint_submitted",
    title: "Custody Checkpoint Updated",
    message: `Evidence submitted for "${checkpoint.label}"`,
  });

  return updated;
}

// ============================================================================
// Checkpoint Confirmation
// ============================================================================

export async function confirmCheckpoint({
  dealId,
  checkpointId,
  userId,
  status,
  disputeReason,
}: {
  dealId: string;
  checkpointId: string;
  userId: string;
  status: "confirmed" | "disputed";
  disputeReason?: string;
}) {
  const role = await getUserWorkflowRole(userId, dealId);
  if (!role) {
    throw new Error("User is not a party to this deal");
  }

  const side = await getUserDealSide(userId, dealId);
  if (!side) {
    throw new Error("Could not determine user's deal side");
  }

  const checkpoint = await prisma.custodyCheckpoint.findUnique({
    where: { id: checkpointId },
    include: {
      custodyLog: true,
      confirmations: true,
    },
  });

  if (!checkpoint) {
    throw new Error("Checkpoint not found");
  }

  if (checkpoint.custodyLog.dealId !== dealId) {
    throw new Error("Checkpoint does not belong to this deal");
  }

  if (checkpoint.isComplete) {
    throw new Error("Checkpoint already completed");
  }

  // Evidence must be submitted before confirmation
  if (!checkpoint.submittedAt) {
    throw new Error("No evidence has been submitted for this checkpoint yet");
  }

  // Cannot confirm own submission (must be from opposite side or different user)
  if (checkpoint.submittedByUserId === userId) {
    throw new Error("Cannot confirm your own checkpoint submission");
  }

  // Check for existing confirmation from this user
  const existingConfirmation = checkpoint.confirmations.find(
    (c) => c.confirmedByUserId === userId
  );
  if (existingConfirmation) {
    throw new Error("You have already confirmed this checkpoint");
  }

  const confirmation = await prisma.custodyConfirmation.create({
    data: {
      checkpointId,
      confirmedByUserId: userId,
      partyRole: role,
      side,
      status,
      disputeReason: status === "disputed" ? disputeReason : null,
    },
  });

  const eventType = status === "confirmed" ? "checkpoint_confirmed" : "checkpoint_disputed";

  await logTimelineEvent({
    dealId,
    userId,
    eventType,
    description: `Checkpoint "${checkpoint.label}" ${status} by ${role} (${side} side)`,
    metadata: {
      checkpointType: checkpoint.checkpointType,
      sequence: checkpoint.sequence,
      status,
      disputeReason,
    },
  });

  // Check if checkpoint is now complete (confirmed by both sides, no disputes)
  const allConfirmations = [...checkpoint.confirmations, confirmation];
  const hasDispute = allConfirmations.some((c) => c.status === "disputed");

  if (!hasDispute) {
    const sellConfirmed = allConfirmations.some((c) => c.side === "sell" && c.status === "confirmed");
    const buyConfirmed = allConfirmations.some((c) => c.side === "buy" && c.status === "confirmed");

    if (sellConfirmed && buyConfirmed) {
      await prisma.custodyCheckpoint.update({
        where: { id: checkpointId },
        data: { isComplete: true, completedAt: new Date() },
      });

      // Check if ALL mandatory checkpoints are now complete
      const allComplete = await isCustodyComplete(dealId);
      if (allComplete) {
        await prisma.custodyLog.update({
          where: { dealId },
          data: { status: "delivered" },
        });

        await logTimelineEvent({
          dealId,
          userId,
          eventType: "custody_complete",
          description: "All custody checkpoints confirmed. Chain of custody verified.",
        });

        await notifyDealParties({
          dealId,
          type: "custody_complete",
          title: "Chain of Custody Complete",
          message: "All checkpoints verified — fund release is now available",
        });
      }
    }
  }

  return confirmation;
}

// ============================================================================
// Custody Status Queries
// ============================================================================

export async function isCustodyComplete(dealId: string): Promise<boolean> {
  const custody = await prisma.custodyLog.findUnique({
    where: { dealId },
    include: {
      checkpoints: {
        where: { isMandatory: true },
      },
    },
  });

  if (!custody || custody.checkpoints.length === 0) return false;

  return custody.checkpoints.every((cp) => cp.isComplete);
}

export async function getFullCustodyLog(dealId: string) {
  return prisma.custodyLog.findUnique({
    where: { dealId },
    include: {
      sealedByUser: { select: { id: true, name: true } },
      releasedToUser: { select: { id: true, name: true } },
      checkpoints: {
        orderBy: { sequence: "asc" },
        include: {
          submittedByUser: { select: { id: true, name: true } },
          confirmations: {
            include: {
              confirmedByUser: { select: { id: true, name: true } },
            },
            orderBy: { confirmedAt: "asc" },
          },
        },
      },
    },
  });
}

// ============================================================================
// Weight Variance Detection
// ============================================================================

async function checkWeightVariance(
  dealId: string,
  custodyLogId: string,
  currentSequence: number,
  currentWeight: number,
  userId: string
) {
  // Find the most recent checkpoint with a weight before this one
  const previousCheckpoint = await prisma.custodyCheckpoint.findFirst({
    where: {
      custodyLogId,
      sequence: { lt: currentSequence },
      weight: { not: null },
    },
    orderBy: { sequence: "desc" },
  });

  if (!previousCheckpoint || previousCheckpoint.weight === null) return;

  const variance = Math.abs(currentWeight - previousCheckpoint.weight) / previousCheckpoint.weight;

  if (variance > WEIGHT_VARIANCE_THRESHOLD) {
    const variancePct = (variance * 100).toFixed(4);

    await logTimelineEvent({
      dealId,
      userId,
      eventType: "weight_variance_detected",
      description: `Weight variance detected: ${variancePct}% between checkpoint ${previousCheckpoint.sequence} (${previousCheckpoint.weight}${previousCheckpoint.weightUnit || "g"}) and checkpoint ${currentSequence} (${currentWeight}${previousCheckpoint.weightUnit || "g"})`,
      metadata: {
        previousWeight: previousCheckpoint.weight,
        currentWeight,
        variance: variancePct,
        previousSequence: previousCheckpoint.sequence,
        currentSequence,
      },
    });

    await notifyDealParties({
      dealId,
      type: "weight_variance_detected",
      title: "Weight Variance Alert",
      message: `${variancePct}% weight difference detected between custody checkpoints`,
    });
  }
}

// ============================================================================
// Integrity Chain Export
// ============================================================================

export async function computeIntegrityChain(dealId: string) {
  const custody = await getFullCustodyLog(dealId);
  if (!custody) return null;

  return {
    sealId: custody.sealId,
    custodian: {
      name: custody.custodianName,
      type: custody.custodianType,
      contact: custody.custodianContact,
    },
    status: custody.status,
    checkpoints: custody.checkpoints.map((cp) => ({
      sequence: cp.sequence,
      type: cp.checkpointType,
      label: cp.label,
      isMandatory: cp.isMandatory,
      isComplete: cp.isComplete,
      submittedAt: cp.submittedAt,
      submittedBy: cp.submittedByUser?.name || null,
      completedAt: cp.completedAt,
      location: {
        name: cp.locationName,
        latitude: cp.latitude,
        longitude: cp.longitude,
      },
      sealIntact: cp.sealIntact,
      weight: cp.weight,
      weightUnit: cp.weightUnit,
      photoHash: cp.photoHash,
      videoHash: cp.videoHash,
      confirmations: cp.confirmations.map((conf) => ({
        confirmedBy: conf.confirmedByUser?.name || null,
        role: conf.partyRole,
        side: conf.side,
        status: conf.status,
        disputeReason: conf.disputeReason,
        confirmedAt: conf.confirmedAt,
      })),
    })),
  };
}
