// ============================================================================
// DealVault: Escrow Workflow Types & Constants
// ============================================================================

// ----------------------------------------------------------------------------
// Workflow Phases
// ----------------------------------------------------------------------------

export const WORKFLOW_PHASES = [
  "listing",
  "documentation",
  "buyer_review",
  "testing",
  "fund_blocking",
  "fund_release",
  "completed",
  "disputed",
  "cancelled",
] as const;

export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

export const WORKFLOW_PHASE_LABELS: Record<WorkflowPhase, string> = {
  listing: "Listing",
  documentation: "Documentation",
  buyer_review: "Buyer Review",
  testing: "Testing & Verification",
  fund_blocking: "Fund Blocking",
  fund_release: "Fund Release",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

export const WORKFLOW_PHASE_COLORS: Record<WorkflowPhase, string> = {
  listing:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  documentation:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  buyer_review:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  testing:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800",
  fund_blocking:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  fund_release:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  disputed:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  cancelled:
    "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700",
};

// The 6 main deal phases (excluding terminal states)
export const WORKFLOW_DEAL_PHASES: WorkflowPhase[] = [
  "listing",
  "documentation",
  "buyer_review",
  "testing",
  "fund_blocking",
  "fund_release",
];

// ----------------------------------------------------------------------------
// Workflow Roles
// ----------------------------------------------------------------------------

export const WORKFLOW_ROLES = [
  "seller",
  "buyer",
  "broker",
  "intermediary",
  "seller_mandate",
  "buyer_mandate",
] as const;

export type WorkflowRole = (typeof WORKFLOW_ROLES)[number];

// Map existing DealParty.role values to workflow role categories
export const PARTY_ROLE_TO_WORKFLOW_ROLE: Record<string, WorkflowRole> = {
  seller: "seller",
  buyer: "buyer",
  seller_mandate: "seller_mandate",
  buyer_mandate: "buyer_mandate",
  seller_intermediary: "intermediary",
  buyer_intermediary: "intermediary",
};

// Map workflow roles to deal sides
export const WORKFLOW_ROLE_SIDES: Record<WorkflowRole, "sell" | "buy" | "neutral"> = {
  seller: "sell",
  buyer: "buy",
  broker: "neutral",
  intermediary: "neutral",
  seller_mandate: "sell",
  buyer_mandate: "buy",
};

// ----------------------------------------------------------------------------
// Phase Gates
// ----------------------------------------------------------------------------

export type PhaseGate =
  | "all_parties_accepted"
  | "seller_documents_uploaded"
  | "buyer_review_approved"
  | "verification_record_created"
  | "verification_passed"
  | "custody_initiated"
  | "escrow_blocked"
  | "escrow_block_confirmed"
  | "delivery_confirmed"
  | "custody_complete";

export const PHASE_GATE_LABELS: Record<PhaseGate, string> = {
  all_parties_accepted: "All parties have accepted the deal invitation",
  seller_documents_uploaded: "Seller has uploaded required documents",
  buyer_review_approved: "Buyer has approved the documentation",
  verification_record_created: "Verification/testing record has been created",
  verification_passed: "Commodity has passed physical verification",
  custody_initiated: "Chain of custody tracking has been initiated",
  escrow_blocked: "Buyer has blocked funds in escrow",
  escrow_block_confirmed: "Intermediary has confirmed fund blocking",
  delivery_confirmed: "Delivery has been confirmed by both parties",
  custody_complete: "All custody checkpoints verified by both sides",
};

// ----------------------------------------------------------------------------
// Phase Transition Rules
// ----------------------------------------------------------------------------

export type PhaseTransitionRule = {
  to: WorkflowPhase;
  triggeredBy: WorkflowRole[];
  gates: PhaseGate[];
};

export const PHASE_TRANSITIONS: Record<WorkflowPhase, PhaseTransitionRule[]> = {
  listing: [
    {
      to: "documentation",
      triggeredBy: ["seller", "broker"],
      gates: ["all_parties_accepted"],
    },
    {
      to: "cancelled",
      triggeredBy: ["seller", "broker", "intermediary"],
      gates: [],
    },
  ],
  documentation: [
    {
      to: "buyer_review",
      triggeredBy: ["seller", "broker"],
      gates: ["seller_documents_uploaded"],
    },
    {
      to: "listing",
      triggeredBy: ["seller", "broker"],
      gates: [],
    },
    {
      to: "cancelled",
      triggeredBy: ["seller", "broker", "intermediary"],
      gates: [],
    },
  ],
  buyer_review: [
    {
      to: "testing",
      triggeredBy: ["buyer", "buyer_mandate"],
      gates: ["buyer_review_approved"],
    },
    {
      to: "documentation",
      triggeredBy: ["buyer", "buyer_mandate"],
      gates: [],
    },
    {
      to: "cancelled",
      triggeredBy: ["buyer", "broker", "intermediary"],
      gates: [],
    },
  ],
  testing: [
    {
      to: "fund_blocking",
      triggeredBy: ["intermediary"],
      gates: ["verification_record_created", "verification_passed", "custody_initiated"],
    },
    {
      to: "documentation",
      triggeredBy: ["intermediary", "buyer"],
      gates: [],
    },
    {
      to: "disputed",
      triggeredBy: ["buyer", "seller", "intermediary"],
      gates: [],
    },
    {
      to: "cancelled",
      triggeredBy: ["intermediary"],
      gates: [],
    },
  ],
  fund_blocking: [
    {
      to: "fund_release",
      triggeredBy: ["intermediary"],
      gates: ["escrow_blocked", "escrow_block_confirmed"],
    },
    {
      to: "disputed",
      triggeredBy: ["buyer", "seller", "intermediary"],
      gates: [],
    },
    {
      to: "cancelled",
      triggeredBy: ["intermediary"],
      gates: [],
    },
  ],
  fund_release: [
    {
      to: "completed",
      triggeredBy: ["intermediary"],
      gates: ["delivery_confirmed", "custody_complete"],
    },
    {
      to: "disputed",
      triggeredBy: ["buyer", "seller", "intermediary"],
      gates: [],
    },
  ],
  completed: [],
  disputed: [
    {
      to: "fund_blocking",
      triggeredBy: ["intermediary"],
      gates: [],
    },
    {
      to: "fund_release",
      triggeredBy: ["intermediary"],
      gates: [],
    },
    {
      to: "cancelled",
      triggeredBy: ["intermediary"],
      gates: [],
    },
  ],
  cancelled: [
    {
      to: "listing",
      triggeredBy: ["seller", "broker"],
      gates: [],
    },
  ],
};

// ----------------------------------------------------------------------------
// Phase Approval Types
// ----------------------------------------------------------------------------

export const APPROVAL_ACTIONS = ["approve", "reject", "request_changes"] as const;
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "request_changes"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

// ----------------------------------------------------------------------------
// Verification Types
// ----------------------------------------------------------------------------

export const VERIFICATION_RESULTS = ["passed", "failed", "conditional"] as const;
export type VerificationResult = (typeof VERIFICATION_RESULTS)[number];

export const VERIFICATION_RESULT_LABELS: Record<VerificationResult, string> = {
  passed: "Passed",
  failed: "Failed",
  conditional: "Conditional Pass",
};

// ----------------------------------------------------------------------------
// Escrow Types
// ----------------------------------------------------------------------------

export const ESCROW_STATUSES = [
  "pending",
  "blocked",
  "block_confirmed",
  "released",
  "refunded",
  "disputed",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  pending: "Pending",
  blocked: "Funds Blocked",
  block_confirmed: "Block Confirmed",
  released: "Funds Released",
  refunded: "Funds Refunded",
  disputed: "Disputed",
};

export const ESCROW_ACTIONS = [
  "block",
  "confirm_block",
  "confirm_delivery",
  "release",
  "refund",
] as const;

export type EscrowAction = (typeof ESCROW_ACTIONS)[number];

// Who can perform each escrow action
export const ESCROW_ACTION_ROLES: Record<EscrowAction, WorkflowRole[]> = {
  block: ["buyer"],
  confirm_block: ["intermediary"],
  confirm_delivery: ["buyer", "intermediary"],
  release: ["intermediary"],
  refund: ["intermediary"],
};

// ----------------------------------------------------------------------------
// Custody Types
// ----------------------------------------------------------------------------

export const CUSTODY_LOG_STATUSES = [
  "initiated",
  "sealed",
  "in_transit",
  "delivered",
  "disputed",
] as const;

export type CustodyLogStatus = (typeof CUSTODY_LOG_STATUSES)[number];

export const CHECKPOINT_TYPES = [
  "sealed_at_refinery",
  "in_vault",
  "transferred_to_logistics",
  "arrived_at_delivery",
  "received_by_buyer",
] as const;

export type CheckpointType = (typeof CHECKPOINT_TYPES)[number];

export const CHECKPOINT_TYPE_LABELS: Record<CheckpointType, string> = {
  sealed_at_refinery: "Sealed at Test Site",
  in_vault: "Stored in Vault / Secure Facility",
  transferred_to_logistics: "Transferred to Logistics",
  arrived_at_delivery: "Arrived at Delivery Point",
  received_by_buyer: "Received by Buyer",
};

export const CUSTODIAN_TYPES = [
  "refinery",
  "bank_vault",
  "security_firm",
  "neutral_party",
] as const;

export type CustodianType = (typeof CUSTODIAN_TYPES)[number];

export const CUSTODIAN_TYPE_LABELS: Record<CustodianType, string> = {
  refinery: "Refinery",
  bank_vault: "Bank Vault",
  security_firm: "Security Firm",
  neutral_party: "Neutral Party",
};

// Default checkpoints created when custody is initiated
export const DEFAULT_CUSTODY_CHECKPOINTS: {
  sequence: number;
  checkpointType: CheckpointType;
  label: string;
  isMandatory: boolean;
}[] = [
  { sequence: 1, checkpointType: "sealed_at_refinery", label: "Sealed at Test Site", isMandatory: true },
  { sequence: 2, checkpointType: "in_vault", label: "Stored in Vault / Secure Facility", isMandatory: false },
  { sequence: 3, checkpointType: "transferred_to_logistics", label: "Transferred to Logistics", isMandatory: true },
  { sequence: 4, checkpointType: "arrived_at_delivery", label: "Arrived at Delivery Point", isMandatory: true },
  { sequence: 5, checkpointType: "received_by_buyer", label: "Received by Buyer", isMandatory: true },
];

// Weight variance threshold for automatic flagging (0.01% = 0.0001)
export const WEIGHT_VARIANCE_THRESHOLD = 0.0001;

// ----------------------------------------------------------------------------
// Workflow Event Types (extends main EVENT_TYPES)
// ----------------------------------------------------------------------------

export const WORKFLOW_EVENT_TYPES = [
  "workflow_created",
  "phase_advanced",
  "phase_rolled_back",
  "phase_approval_submitted",
  "verification_recorded",
  "escrow_blocked",
  "escrow_block_confirmed",
  "escrow_released",
  "escrow_refunded",
  "dispute_raised",
  "dispute_resolved",
  "custody_initiated",
  "checkpoint_submitted",
  "checkpoint_confirmed",
  "checkpoint_disputed",
  "custody_complete",
  "weight_variance_detected",
  "serial_mismatch_detected",
] as const;

export type WorkflowEventType = (typeof WORKFLOW_EVENT_TYPES)[number];
