/**
 * Compliance Service — Regulatory checklist management.
 *
 * Frameworks: SADPMR, FICA/AML, Kimberley Process, LBMA
 * Each framework has specific requirements per commodity type.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

type ComplianceFramework = "sadpmr" | "fica_aml" | "kimberley_process" | "lbma";

interface RequirementDef {
  requirement: string;
  description: string;
}

const FRAMEWORK_REQUIREMENTS: Record<ComplianceFramework, {
  label: string;
  commodities: string[];
  requirements: RequirementDef[];
}> = {
  sadpmr: {
    label: "SADPMR (South African Diamond & Precious Metals Regulator)",
    commodities: ["gold", "diamond", "platinum"],
    requirements: [
      { requirement: "Dealer License", description: "Valid SADPMR dealer registration number" },
      { requirement: "Transaction Record", description: "Complete transaction details per SADPMR Form 3" },
      { requirement: "Source Declaration", description: "Signed declaration of commodity origin" },
      { requirement: "Transport Permit", description: "Valid transport permit for commodity movement" },
      { requirement: "Monthly Return", description: "Monthly transaction return filed with SADPMR" },
    ],
  },
  fica_aml: {
    label: "FICA/AML (Financial Intelligence Centre Act)",
    commodities: ["gold", "diamond", "platinum", "tanzanite"],
    requirements: [
      { requirement: "Customer Due Diligence", description: "CDD completed for all deal parties" },
      { requirement: "Proof of Identity", description: "Government-issued ID for all signatories" },
      { requirement: "Proof of Address", description: "Utility bill or bank statement (< 3 months)" },
      { requirement: "Source of Funds", description: "Declaration and evidence of fund origin" },
      { requirement: "Suspicious Transaction Report", description: "STR filed if applicable (Section 29)" },
      { requirement: "Record Retention", description: "All documents retained for minimum 5 years" },
    ],
  },
  kimberley_process: {
    label: "Kimberley Process Certification Scheme",
    commodities: ["diamond"],
    requirements: [
      { requirement: "Kimberley Certificate", description: "Valid KP certificate for rough diamond shipment" },
      { requirement: "Country of Origin", description: "Verified country of origin documentation" },
      { requirement: "Tamper-Resistant Container", description: "Shipment in sealed, tamper-resistant container" },
      { requirement: "Export License", description: "Government export license from origin country" },
      { requirement: "Import License", description: "Government import license for destination country" },
    ],
  },
  lbma: {
    label: "LBMA (London Bullion Market Association)",
    commodities: ["gold", "platinum"],
    requirements: [
      { requirement: "Good Delivery Status", description: "Refinery on LBMA Good Delivery List" },
      { requirement: "Assay Certificate", description: "Assay from LBMA-approved assayer" },
      { requirement: "Chain of Custody Record", description: "Complete chain of custody documentation" },
      { requirement: "Conflict-Free Declaration", description: "Signed conflict-free sourcing declaration" },
      { requirement: "Know Your Customer", description: "Full KYC on all counterparties" },
    ],
  },
};

export function getApplicableFrameworks(commodity: string): ComplianceFramework[] {
  const lowerCommodity = commodity.toLowerCase();
  return (Object.entries(FRAMEWORK_REQUIREMENTS) as [ComplianceFramework, typeof FRAMEWORK_REQUIREMENTS[ComplianceFramework]][])
    .filter(([, def]) => def.commodities.includes(lowerCommodity))
    .map(([key]) => key);
}

export async function initializeComplianceForDeal(dealId: string, commodity: string) {
  const frameworks = getApplicableFrameworks(commodity);

  for (const framework of frameworks) {
    const existing = await prisma.complianceChecklist.findUnique({
      where: { dealId_framework: { dealId, framework } },
    });

    if (existing) continue;

    const def = FRAMEWORK_REQUIREMENTS[framework];

    await prisma.complianceChecklist.create({
      data: {
        dealId,
        framework,
        status: "pending",
        items: {
          create: def.requirements.map((req) => ({
            requirement: req.requirement,
            description: req.description,
            status: "pending",
          })),
        },
      },
    });

    logger.info("[Compliance] Checklist initialized", { dealId, framework });
  }
}

export async function getDealCompliance(dealId: string) {
  return prisma.complianceChecklist.findMany({
    where: { dealId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { framework: "asc" },
  });
}

export async function updateComplianceItem(
  itemId: string,
  status: "met" | "not_met" | "na",
  evidenceNote?: string,
  documentId?: string
) {
  const item = await prisma.complianceItem.update({
    where: { id: itemId },
    data: {
      status,
      evidenceNote: evidenceNote || null,
      documentId: documentId || null,
      completedAt: status === "met" ? new Date() : null,
    },
  });

  // Check if all items in the checklist are resolved
  const checklist = await prisma.complianceChecklist.findFirst({
    where: { items: { some: { id: itemId } } },
    include: { items: true },
  });

  if (checklist) {
    const allResolved = checklist.items.every(
      (i) => i.status === "met" || i.status === "na"
    );
    const hasFailure = checklist.items.some((i) => i.status === "not_met");

    await prisma.complianceChecklist.update({
      where: { id: checklist.id },
      data: {
        status: allResolved ? "compliant" : hasFailure ? "non_compliant" : "in_progress",
        completedAt: allResolved ? new Date() : null,
      },
    });
  }

  return item;
}

export function getFrameworkLabel(framework: string): string {
  return FRAMEWORK_REQUIREMENTS[framework as ComplianceFramework]?.label || framework;
}

export function getAllFrameworkDefinitions() {
  return FRAMEWORK_REQUIREMENTS;
}
