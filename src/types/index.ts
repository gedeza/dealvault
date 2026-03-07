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
  draft: "bg-gray-100 text-gray-800",
  documents_pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  in_progress: "bg-purple-100 text-purple-800",
  settled: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-200 text-gray-900",
  cancelled: "bg-red-100 text-red-800",
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
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
