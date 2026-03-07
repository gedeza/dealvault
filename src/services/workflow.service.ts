import { prisma } from "@/lib/db";
import { logTimelineEvent } from "@/services/timeline.service";
import { notifyDealParties } from "@/services/notification.service";
import {
  type WorkflowPhase,
  type WorkflowRole,
  PHASE_TRANSITIONS,
  PARTY_ROLE_TO_WORKFLOW_ROLE,
  WORKFLOW_PHASE_LABELS,
  DEFAULT_CUSTODY_CHECKPOINTS,
} from "@/types/workflow";

// ============================================================================
// Role Resolution
// ============================================================================

export async function getUserWorkflowRole(
  userId: string,
  dealId: string
): Promise<WorkflowRole | null> {
  const party = await prisma.dealParty.findUnique({
    where: { dealId_userId: { dealId, userId } },
  });

  if (party) {
    return PARTY_ROLE_TO_WORKFLOW_ROLE[party.role] || null;
  }

  // If user is the deal creator but not a party, default to seller
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { creatorId: true },
  });

  if (deal && deal.creatorId === userId) {
    return "seller";
  }

  return null;
}

export async function getUserDealSide(
  userId: string,
  dealId: string
): Promise<"sell" | "buy" | null> {
  const party = await prisma.dealParty.findUnique({
    where: { dealId_userId: { dealId, userId } },
    select: { side: true },
  });

  if (party) {
    return party.side as "sell" | "buy";
  }

  // Creator defaults to sell side
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { creatorId: true },
  });

  if (deal && deal.creatorId === userId) {
    return "sell";
  }

  return null;
}

// ============================================================================
// Gate Checking
// ============================================================================

export type GateCheckResult = {
  satisfied: boolean;
  missing: string[];
};

export async function checkGates(
  workflowId: string,
  dealId: string,
  targetPhase: WorkflowPhase
): Promise<GateCheckResult> {
  const workflow = await prisma.dealWorkflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    return { satisfied: false, missing: ["workflow_not_found"] };
  }

  const currentPhase = workflow.phase as WorkflowPhase;
  const rules = PHASE_TRANSITIONS[currentPhase];
  const rule = rules.find((r) => r.to === targetPhase);

  if (!rule) {
    return { satisfied: false, missing: [`invalid_transition_${currentPhase}_to_${targetPhase}`] };
  }

  if (rule.gates.length === 0) {
    return { satisfied: true, missing: [] };
  }

  const missing: string[] = [];

  for (const gate of rule.gates) {
    const isMet = await checkSingleGate(gate, dealId, workflowId);
    if (!isMet) {
      missing.push(gate);
    }
  }

  return { satisfied: missing.length === 0, missing };
}

async function checkSingleGate(
  gate: string,
  dealId: string,
  workflowId: string
): Promise<boolean> {
  switch (gate) {
    case "all_parties_accepted": {
      const pendingCount = await prisma.dealParty.count({
        where: { dealId, status: { not: "accepted" } },
      });
      return pendingCount === 0;
    }

    case "seller_documents_uploaded": {
      const docCount = await prisma.document.count({
        where: { dealId, visibility: "deal" },
      });
      return docCount >= 1;
    }

    case "buyer_review_approved": {
      const approval = await prisma.phaseApproval.findFirst({
        where: {
          workflowId,
          phase: "buyer_review",
          requiredRole: "buyer",
          status: "approved",
        },
      });
      return approval !== null;
    }

    case "verification_record_created": {
      const record = await prisma.verificationRecord.findUnique({
        where: { workflowId },
      });
      return record !== null;
    }

    case "verification_passed": {
      const record = await prisma.verificationRecord.findUnique({
        where: { workflowId },
      });
      return record?.result === "passed" || record?.result === "conditional";
    }

    case "custody_initiated": {
      const custody = await prisma.custodyLog.findUnique({
        where: { dealId },
      });
      return custody !== null;
    }

    case "escrow_blocked": {
      const escrow = await prisma.escrowRecord.findUnique({
        where: { workflowId },
      });
      return escrow?.blockedAt !== null;
    }

    case "escrow_block_confirmed": {
      const escrow = await prisma.escrowRecord.findUnique({
        where: { workflowId },
      });
      return escrow?.blockConfirmedAt !== null;
    }

    case "delivery_confirmed": {
      const escrow = await prisma.escrowRecord.findUnique({
        where: { workflowId },
      });
      return escrow?.deliveryConfirmedAt !== null;
    }

    case "custody_complete": {
      return isCustodyComplete(dealId);
    }

    default:
      return false;
  }
}

// ============================================================================
// Workflow Creation
// ============================================================================

export async function createWorkflow(
  dealId: string,
  userId: string
): Promise<{ workflow: Awaited<ReturnType<typeof prisma.dealWorkflow.create>> }> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, creatorId: true, value: true, currency: true, title: true },
  });

  if (!deal) {
    throw new Error("Deal not found");
  }

  if (deal.creatorId !== userId) {
    throw new Error("Only the deal creator can create a workflow");
  }

  const existing = await prisma.dealWorkflow.findUnique({
    where: { dealId },
  });

  if (existing) {
    throw new Error("Workflow already exists for this deal");
  }

  const workflow = await prisma.$transaction(async (tx) => {
    const wf = await tx.dealWorkflow.create({
      data: {
        dealId,
        phase: "listing",
      },
    });

    // Create escrow record
    await tx.escrowRecord.create({
      data: {
        workflowId: wf.id,
        currency: deal.currency,
        amount: deal.value,
      },
    });

    // Update deal to reflect workflow mode
    await tx.deal.update({
      where: { id: dealId },
      data: { workflowPhase: "listing" },
    });

    return wf;
  });

  await logTimelineEvent({
    dealId,
    userId,
    eventType: "workflow_created",
    description: "Escrow workflow enabled for this deal",
    metadata: { phase: "listing" },
  });

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: "workflow_created",
    title: "Escrow Workflow Enabled",
    message: `"${deal.title}" now uses the escrow workflow`,
  });

  return { workflow };
}

// ============================================================================
// Phase Advancement
// ============================================================================

export async function advancePhase(
  dealId: string,
  targetPhase: WorkflowPhase,
  userId: string,
  reason?: string
): Promise<{ workflow: Awaited<ReturnType<typeof prisma.dealWorkflow.update>> }> {
  const workflow = await prisma.dealWorkflow.findUnique({
    where: { dealId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const currentPhase = workflow.phase as WorkflowPhase;

  // Validate transition exists
  const rules = PHASE_TRANSITIONS[currentPhase];
  const rule = rules.find((r) => r.to === targetPhase);

  if (!rule) {
    throw new Error(
      `Cannot transition from "${currentPhase}" to "${targetPhase}"`
    );
  }

  // Validate caller role
  const userRole = await getUserWorkflowRole(userId, dealId);
  if (!userRole || !rule.triggeredBy.includes(userRole)) {
    throw new Error(
      `Role "${userRole}" cannot trigger transition to "${targetPhase}". Required: ${rule.triggeredBy.join(", ")}`
    );
  }

  // Check gates
  const gateResult = await checkGates(workflow.id, dealId, targetPhase);
  if (!gateResult.satisfied) {
    throw new Error(
      `Gate conditions not met: ${gateResult.missing.join(", ")}`
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    phase: targetPhase,
    phaseStartedAt: new Date(),
  };

  if (targetPhase === "completed") {
    updateData.completedAt = new Date();
  } else if (targetPhase === "cancelled") {
    updateData.cancelledAt = new Date();
    updateData.cancelReason = reason || null;
  } else if (targetPhase === "disputed") {
    updateData.disputedAt = new Date();
    updateData.disputeReason = reason || null;
  }

  // Execute in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Re-read inside transaction to prevent TOCTOU
    const fresh = await tx.dealWorkflow.findUnique({
      where: { id: workflow.id },
    });

    if (!fresh || fresh.phase !== currentPhase) {
      throw new Error("Workflow phase changed concurrently");
    }

    const wf = await tx.dealWorkflow.update({
      where: { id: workflow.id },
      data: updateData,
    });

    // Sync deal.workflowPhase
    await tx.deal.update({
      where: { id: dealId },
      data: { workflowPhase: targetPhase },
    });

    // Create pending approval records for the new phase
    await createPhaseApprovals(tx, workflow.id, targetPhase);

    // If completing, settle commissions
    if (targetPhase === "completed") {
      await settleCommissions(tx, dealId);
    }

    return wf;
  });

  const isRollback = getPhaseIndex(targetPhase) < getPhaseIndex(currentPhase);

  await logTimelineEvent({
    dealId,
    userId,
    eventType: isRollback ? "phase_rolled_back" : "phase_advanced",
    description: `Workflow ${isRollback ? "rolled back" : "advanced"} from "${WORKFLOW_PHASE_LABELS[currentPhase]}" to "${WORKFLOW_PHASE_LABELS[targetPhase]}"`,
    metadata: {
      from: currentPhase,
      to: targetPhase,
      reason: reason || null,
    },
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { title: true },
  });

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: "phase_advanced",
    title: "Deal Phase Updated",
    message: `"${deal?.title}" is now in ${WORKFLOW_PHASE_LABELS[targetPhase]}`,
  });

  return { workflow: updated };
}

// ============================================================================
// Phase Approvals
// ============================================================================

async function createPhaseApprovals(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  workflowId: string,
  phase: WorkflowPhase
) {
  // Define which roles need to approve at each phase
  const phaseApprovalRequirements: Partial<Record<WorkflowPhase, string[]>> = {
    buyer_review: ["buyer"],
    testing: ["intermediary"],
    fund_blocking: ["buyer", "intermediary"],
    fund_release: ["intermediary"],
  };

  const requiredRoles = phaseApprovalRequirements[phase];
  if (!requiredRoles) return;

  for (const role of requiredRoles) {
    // Don't create duplicates
    const existing = await tx.phaseApproval.findFirst({
      where: { workflowId, phase, requiredRole: role },
    });
    if (!existing) {
      await tx.phaseApproval.create({
        data: {
          workflowId,
          phase,
          requiredRole: role,
          action: "pending",
          status: "pending",
        },
      });
    }
  }
}

export async function submitPhaseApproval({
  dealId,
  workflowId,
  phase,
  action,
  notes,
  userId,
}: {
  dealId: string;
  workflowId: string;
  phase: WorkflowPhase;
  action: "approve" | "reject" | "request_changes";
  notes?: string;
  userId: string;
}) {
  const userRole = await getUserWorkflowRole(userId, dealId);
  if (!userRole) {
    throw new Error("User is not a party to this deal");
  }

  // Find the pending approval for this role
  const approval = await prisma.phaseApproval.findFirst({
    where: {
      workflowId,
      phase,
      requiredRole: userRole,
      status: "pending",
    },
  });

  if (!approval) {
    throw new Error(`No pending approval for role "${userRole}" at phase "${phase}"`);
  }

  const statusMap = {
    approve: "approved",
    reject: "rejected",
    request_changes: "request_changes",
  } as const;

  const updated = await prisma.phaseApproval.update({
    where: { id: approval.id },
    data: {
      action,
      status: statusMap[action],
      notes: notes || null,
      decidedById: userId,
      decidedAt: new Date(),
    },
  });

  await logTimelineEvent({
    dealId,
    userId,
    eventType: "phase_approval_submitted",
    description: `Phase "${WORKFLOW_PHASE_LABELS[phase]}" ${action}ed by ${userRole}`,
    metadata: { phase, action, role: userRole, notes },
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { title: true },
  });

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: "phase_approval_submitted",
    title: `Phase ${action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Changes Requested"}`,
    message: `${WORKFLOW_PHASE_LABELS[phase]} phase ${action}ed on "${deal?.title}"`,
  });

  return updated;
}

// ============================================================================
// Verification
// ============================================================================

export async function upsertVerification({
  dealId,
  workflowId,
  userId,
  data,
}: {
  dealId: string;
  workflowId: string;
  userId: string;
  data: {
    location?: string;
    scheduledAt?: string;
    completedAt?: string;
    inspectorName?: string;
    inspectorCompany?: string;
    result?: string;
    findings?: string;
    assayDocumentId?: string;
  };
}) {
  const userRole = await getUserWorkflowRole(userId, dealId);
  if (userRole !== "intermediary") {
    throw new Error("Only intermediary can manage verification records");
  }

  const updateData: Record<string, unknown> = {};
  if (data.location !== undefined) updateData.location = data.location;
  if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
  if (data.completedAt !== undefined) updateData.completedAt = new Date(data.completedAt);
  if (data.inspectorName !== undefined) updateData.inspectorName = data.inspectorName;
  if (data.inspectorCompany !== undefined) updateData.inspectorCompany = data.inspectorCompany;
  if (data.result !== undefined) updateData.result = data.result;
  if (data.findings !== undefined) updateData.findings = data.findings;
  if (data.assayDocumentId !== undefined) updateData.assayDocumentId = data.assayDocumentId;

  const record = await prisma.verificationRecord.upsert({
    where: { workflowId },
    create: {
      workflowId,
      ...updateData,
    },
    update: updateData,
  });

  await logTimelineEvent({
    dealId,
    userId,
    eventType: "verification_recorded",
    description: `Verification record ${data.result ? `result: ${data.result}` : "updated"}`,
    metadata: { result: data.result, location: data.location },
  });

  return record;
}

// ============================================================================
// Escrow Actions
// ============================================================================

export async function processEscrowAction({
  dealId,
  workflowId,
  userId,
  action,
  referenceNumber,
  notes,
}: {
  dealId: string;
  workflowId: string;
  userId: string;
  action: "block" | "confirm_block" | "confirm_delivery" | "release" | "refund";
  referenceNumber?: string;
  notes?: string;
}) {
  const userRole = await getUserWorkflowRole(userId, dealId);
  if (!userRole) {
    throw new Error("User is not a party to this deal");
  }

  // Validate role permissions
  const allowedRoles: Record<string, WorkflowRole[]> = {
    block: ["buyer"],
    confirm_block: ["intermediary"],
    confirm_delivery: ["buyer", "intermediary"],
    release: ["intermediary"],
    refund: ["intermediary"],
  };

  if (!allowedRoles[action].includes(userRole)) {
    throw new Error(`Role "${userRole}" cannot perform escrow action "${action}"`);
  }

  const escrow = await prisma.escrowRecord.findUnique({
    where: { workflowId },
  });

  if (!escrow) {
    throw new Error("Escrow record not found");
  }

  // Validate state transitions
  const validTransitions: Record<string, string[]> = {
    block: ["pending"],
    confirm_block: ["blocked"],
    confirm_delivery: ["block_confirmed"],
    release: ["block_confirmed"],
    refund: ["blocked", "block_confirmed", "disputed"],
  };

  if (!validTransitions[action].includes(escrow.status)) {
    throw new Error(`Cannot "${action}" when escrow is "${escrow.status}"`);
  }

  const updateData: Record<string, unknown> = { notes: notes || escrow.notes };

  switch (action) {
    case "block":
      updateData.blockedAt = new Date();
      updateData.status = "blocked";
      updateData.referenceNumber = referenceNumber || null;
      break;
    case "confirm_block":
      updateData.blockConfirmedAt = new Date();
      updateData.blockConfirmedById = userId;
      updateData.status = "block_confirmed";
      break;
    case "confirm_delivery":
      updateData.deliveryConfirmedAt = new Date();
      updateData.deliveryConfirmedById = userId;
      break;
    case "release":
      updateData.releasedAt = new Date();
      updateData.releasedById = userId;
      updateData.status = "released";
      break;
    case "refund":
      updateData.refundedAt = new Date();
      updateData.refundedById = userId;
      updateData.status = "refunded";
      break;
  }

  const updated = await prisma.escrowRecord.update({
    where: { id: escrow.id },
    data: updateData,
  });

  const eventTypeMap: Record<string, string> = {
    block: "escrow_blocked",
    confirm_block: "escrow_block_confirmed",
    confirm_delivery: "escrow_block_confirmed",
    release: "escrow_released",
    refund: "escrow_refunded",
  };

  await logTimelineEvent({
    dealId,
    userId,
    eventType: eventTypeMap[action],
    description: `Escrow action: ${action}${referenceNumber ? ` (ref: ${referenceNumber})` : ""}`,
    metadata: { action, referenceNumber, status: updated.status },
  });

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { title: true },
  });

  await notifyDealParties({
    dealId,
    excludeUserId: userId,
    type: eventTypeMap[action],
    title: "Escrow Update",
    message: `Escrow ${action.replace("_", " ")} on "${deal?.title}"`,
  });

  return updated;
}

// ============================================================================
// Helpers
// ============================================================================

const PHASE_ORDER: WorkflowPhase[] = [
  "listing",
  "documentation",
  "buyer_review",
  "testing",
  "fund_blocking",
  "fund_release",
  "completed",
];

function getPhaseIndex(phase: WorkflowPhase): number {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx >= 0 ? idx : -1;
}

async function settleCommissions(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  dealId: string
) {
  const deal = await tx.deal.findUnique({
    where: { id: dealId },
    include: {
      parties: true,
      commissionLedger: true,
    },
  });

  if (!deal) return;

  const partiesWithCommission = deal.parties.filter((p) => p.commissionPct > 0);
  const existingPartyIds = new Set(deal.commissionLedger.map((l) => l.partyId));

  for (const party of partiesWithCommission) {
    if (!existingPartyIds.has(party.id)) {
      await tx.commissionLedger.create({
        data: {
          dealId,
          partyId: party.id,
          agreedPct: party.commissionPct,
          calculatedAmount: deal.value * party.commissionPct,
          status: "agreed",
        },
      });
    }
  }
}

async function isCustodyComplete(dealId: string): Promise<boolean> {
  const custody = await prisma.custodyLog.findUnique({
    where: { dealId },
    include: {
      checkpoints: {
        where: { isMandatory: true },
        include: { confirmations: true },
      },
    },
  });

  if (!custody) return false;

  for (const checkpoint of custody.checkpoints) {
    if (!checkpoint.isComplete) return false;
  }

  return custody.checkpoints.length > 0;
}

export async function getFullWorkflow(dealId: string) {
  return prisma.dealWorkflow.findUnique({
    where: { dealId },
    include: {
      phaseApprovals: {
        include: {
          decidedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      verificationRecord: {
        include: {
          assayDocument: {
            select: { id: true, name: true, type: true, sha256Hash: true },
          },
        },
      },
      escrow: {
        include: {
          blockConfirmedBy: { select: { id: true, name: true } },
          deliveryConfirmedBy: { select: { id: true, name: true } },
          releasedBy: { select: { id: true, name: true } },
          refundedBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}
