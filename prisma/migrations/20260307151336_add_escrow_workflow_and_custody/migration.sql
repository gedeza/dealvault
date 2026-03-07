-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "workflowPhase" TEXT;

-- CreateTable
CREATE TABLE "DealWorkflow" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'listing',
    "phaseStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phaseDeadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "disputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dealId" TEXT NOT NULL,

    CONSTRAINT "DealWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseApproval" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'pending',
    "requiredRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflowId" TEXT NOT NULL,
    "decidedById" TEXT,

    CONSTRAINT "PhaseApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL,
    "location" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "inspectorName" TEXT,
    "inspectorCompany" TEXT,
    "result" TEXT,
    "findings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowId" TEXT NOT NULL,
    "assayDocumentId" TEXT,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowRecord" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockConfirmedAt" TIMESTAMP(3),
    "blockConfirmedById" TEXT,
    "deliveryConfirmedAt" TIMESTAMP(3),
    "deliveryConfirmedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedById" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowId" TEXT NOT NULL,

    CONSTRAINT "EscrowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyLog" (
    "id" TEXT NOT NULL,
    "sealId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "sealedAt" TIMESTAMP(3),
    "sealedByUserId" TEXT,
    "sealPhotoPath" TEXT,
    "sealPhotoHash" TEXT,
    "custodianName" TEXT,
    "custodianType" TEXT,
    "custodianContact" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dealId" TEXT NOT NULL,

    CONSTRAINT "CustodyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyCheckpoint" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "checkpointType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "notes" TEXT,
    "sealIntact" BOOLEAN,
    "weight" DOUBLE PRECISION,
    "weightUnit" TEXT,
    "photoPath" TEXT,
    "photoHash" TEXT,
    "videoPath" TEXT,
    "videoHash" TEXT,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "custodyLogId" TEXT NOT NULL,

    CONSTRAINT "CustodyCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyConfirmation" (
    "id" TEXT NOT NULL,
    "partyRole" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "disputeReason" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkpointId" TEXT NOT NULL,
    "confirmedByUserId" TEXT NOT NULL,

    CONSTRAINT "CustodyConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealWorkflow_dealId_key" ON "DealWorkflow"("dealId");

-- CreateIndex
CREATE INDEX "DealWorkflow_dealId_idx" ON "DealWorkflow"("dealId");

-- CreateIndex
CREATE INDEX "DealWorkflow_phase_idx" ON "DealWorkflow"("phase");

-- CreateIndex
CREATE INDEX "PhaseApproval_workflowId_phase_idx" ON "PhaseApproval"("workflowId", "phase");

-- CreateIndex
CREATE INDEX "PhaseApproval_workflowId_status_idx" ON "PhaseApproval"("workflowId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRecord_workflowId_key" ON "VerificationRecord"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRecord_assayDocumentId_key" ON "VerificationRecord"("assayDocumentId");

-- CreateIndex
CREATE INDEX "VerificationRecord_workflowId_idx" ON "VerificationRecord"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowRecord_workflowId_key" ON "EscrowRecord"("workflowId");

-- CreateIndex
CREATE INDEX "EscrowRecord_workflowId_idx" ON "EscrowRecord"("workflowId");

-- CreateIndex
CREATE INDEX "EscrowRecord_status_idx" ON "EscrowRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyLog_dealId_key" ON "CustodyLog"("dealId");

-- CreateIndex
CREATE INDEX "CustodyLog_dealId_idx" ON "CustodyLog"("dealId");

-- CreateIndex
CREATE INDEX "CustodyLog_sealId_idx" ON "CustodyLog"("sealId");

-- CreateIndex
CREATE INDEX "CustodyCheckpoint_custodyLogId_idx" ON "CustodyCheckpoint"("custodyLogId");

-- CreateIndex
CREATE INDEX "CustodyCheckpoint_custodyLogId_sequence_idx" ON "CustodyCheckpoint"("custodyLogId", "sequence");

-- CreateIndex
CREATE INDEX "CustodyConfirmation_checkpointId_idx" ON "CustodyConfirmation"("checkpointId");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyConfirmation_checkpointId_confirmedByUserId_key" ON "CustodyConfirmation"("checkpointId", "confirmedByUserId");

-- AddForeignKey
ALTER TABLE "DealWorkflow" ADD CONSTRAINT "DealWorkflow_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseApproval" ADD CONSTRAINT "PhaseApproval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "DealWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseApproval" ADD CONSTRAINT "PhaseApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "DealWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_assayDocumentId_fkey" FOREIGN KEY ("assayDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_blockConfirmedById_fkey" FOREIGN KEY ("blockConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_deliveryConfirmedById_fkey" FOREIGN KEY ("deliveryConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_refundedById_fkey" FOREIGN KEY ("refundedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowRecord" ADD CONSTRAINT "EscrowRecord_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "DealWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyLog" ADD CONSTRAINT "CustodyLog_sealedByUserId_fkey" FOREIGN KEY ("sealedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyLog" ADD CONSTRAINT "CustodyLog_releasedToUserId_fkey" FOREIGN KEY ("releasedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyLog" ADD CONSTRAINT "CustodyLog_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyCheckpoint" ADD CONSTRAINT "CustodyCheckpoint_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyCheckpoint" ADD CONSTRAINT "CustodyCheckpoint_custodyLogId_fkey" FOREIGN KEY ("custodyLogId") REFERENCES "CustodyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyConfirmation" ADD CONSTRAINT "CustodyConfirmation_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "CustodyCheckpoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyConfirmation" ADD CONSTRAINT "CustodyConfirmation_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
