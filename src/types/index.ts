import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const DEAL_STATUSES = [
  "draft",
  "documents_pending",
  "under_review",
  "verified",
  "in_progress",
  "settled",
  "closed",
  "cancelled",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: "Draft",
  documents_pending: "Documents Pending",
  under_review: "Under Review",
  verified: "Verified",
  in_progress: "In Progress",
  settled: "Settled",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  documents_pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  in_progress: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800",
  settled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
  closed: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
};

export const COMMODITIES = ["gold", "diamonds", "platinum"] as const;
export type Commodity = (typeof COMMODITIES)[number];

export const UNITS: Record<Commodity, string[]> = {
  gold: ["kg", "oz", "g"],
  diamonds: ["carats"],
  platinum: ["kg", "oz", "g"],
};

export const PARTY_ROLES = [
  "seller",
  "buyer",
  "seller_mandate",
  "buyer_mandate",
  "seller_intermediary",
  "buyer_intermediary",
] as const;

export type PartyRole = (typeof PARTY_ROLES)[number];

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  seller: "Seller",
  buyer: "Buyer",
  seller_mandate: "Seller's Mandate",
  buyer_mandate: "Buyer's Mandate",
  seller_intermediary: "Seller's Intermediary",
  buyer_intermediary: "Buyer's Intermediary",
};

export const DOCUMENT_TYPES = [
  "SPA",
  "NCNDA",
  "IMFPA",
  "BCL",
  "POF",
  "FCO",
  "ICPO",
  "assay_report",
  "export_permit",
  "certificate_of_origin",
  "kyc",
  "id_document",
  "cipc",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SPA: "Sale & Purchase Agreement",
  NCNDA: "Non-Circumvention, Non-Disclosure Agreement",
  IMFPA: "Irrevocable Master Fee Protection Agreement",
  BCL: "Bank Comfort Letter",
  POF: "Proof of Funds",
  FCO: "Full Corporate Offer",
  ICPO: "Irrevocable Corporate Purchase Order",
  assay_report: "Assay Report",
  export_permit: "Export Permit",
  certificate_of_origin: "Certificate of Origin",
  kyc: "KYC Pack",
  id_document: "ID Document",
  cipc: "CIPC Registration",
  other: "Other Document",
};

export const VALID_STATUS_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ["documents_pending", "cancelled"],
  documents_pending: ["under_review", "draft", "cancelled"],
  under_review: ["verified", "documents_pending", "cancelled"],
  verified: ["in_progress", "cancelled"],
  in_progress: ["settled", "cancelled"],
  settled: ["closed"],
  closed: [],
  cancelled: ["draft"],
};

export const EVENT_TYPES = [
  "deal_created",
  "party_invited",
  "party_accepted",
  "document_uploaded",
  "document_verified",
  "status_changed",
  "message_sent",
  "commission_agreed",
  "deal_settled",
  // Workflow events
  "workflow_created",
  "phase_advanced",
  "phase_rolled_back",
  "phase_approval_submitted",
  "verification_recorded",
  // Escrow events
  "escrow_blocked",
  "escrow_block_confirmed",
  "escrow_released",
  "escrow_refunded",
  // Dispute events
  "dispute_raised",
  "dispute_resolved",
  // Custody events
  "custody_initiated",
  "checkpoint_submitted",
  "checkpoint_confirmed",
  "checkpoint_disputed",
  "custody_complete",
  "weight_variance_detected",
  "serial_mismatch_detected",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
