import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
};

/**
 * Deal Room Assistant — answers questions about a deal's status,
 * timeline, next steps, and workflow gates.
 */
export async function dealRoomAssistant(params: {
  dealId: string;
  userId: string;
  question: string;
}): Promise<string> {
  const deal = await prisma.deal.findUnique({
    where: { id: params.dealId },
    include: {
      creator: { select: { name: true } },
      parties: {
        include: { user: { select: { name: true, email: true } } },
      },
      documents: { select: { name: true, type: true, createdAt: true } },
      timeline: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
      commissionLedger: {
        include: { party: { include: { user: { select: { name: true } } } } },
      },
    },
  });

  if (!deal) throw new Error("Deal not found");

  // Build deal context for the AI
  const dealContext = {
    dealNumber: deal.dealNumber,
    title: deal.title,
    status: deal.status,
    workflowPhase: deal.workflowPhase,
    commodity: deal.commodity,
    quantity: `${deal.quantity} ${deal.unit}`,
    value: `${deal.currency} ${deal.value.toLocaleString()}`,
    commissionPool: `${(deal.commissionPool * 100).toFixed(1)}%`,
    creator: deal.creator.name,
    parties: deal.parties.map((p) => ({
      name: p.user.name,
      role: p.role,
      side: p.side,
      status: p.status,
      commission: `${(p.commissionPct * 100).toFixed(1)}%`,
    })),
    documents: deal.documents.map((d) => ({
      name: d.name,
      type: d.type,
      uploaded: d.createdAt,
    })),
    recentTimeline: deal.timeline.map((t) => ({
      event: t.eventType,
      description: t.description,
      by: t.user.name,
      at: t.createdAt,
    })),
    commission: deal.commissionLedger.map((c) => ({
      party: c.party.user.name,
      percentage: `${(c.agreedPct * 100).toFixed(1)}%`,
      amount: c.calculatedAmount,
    })),
  };

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are the DealVault Deal Room Assistant. You help deal participants understand their deal's status, next steps, and answer questions about the deal.

You have access to the following deal data:
${JSON.stringify(dealContext, null, 2)}

Rules:
- Be concise and direct. Use bullet points when listing multiple items.
- Only answer questions about THIS deal. If asked about anything unrelated, politely decline.
- Never reveal sensitive financial details to unauthorized parties.
- When explaining next steps, reference the workflow phase gates if applicable.
- Use the deal number (${deal.dealNumber}) when referencing the deal.
- Format currency values with proper symbols and commas.
- If asked to summarize the timeline, focus on the most recent and significant events.`,
    messages: [
      {
        role: "user",
        content: params.question,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "I couldn't generate a response. Please try again.";
}

/**
 * Generate a smart notification summary for deal events.
 * Used to craft contextual, human-readable notification messages.
 */
export async function generateSmartNotification(params: {
  dealId: string;
  eventType: string;
  rawDetail: string;
}): Promise<string> {
  const deal = await prisma.deal.findUnique({
    where: { id: params.dealId },
    select: {
      dealNumber: true,
      title: true,
      status: true,
      workflowPhase: true,
      commodity: true,
      value: true,
      currency: true,
    },
  });

  if (!deal) return params.rawDetail;

  try {
    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: `You write concise, actionable deal notification summaries for DealVault.
Keep it to 1-2 sentences max. Include the deal number and what action the recipient should take next, if any.
Deal: ${deal.dealNumber} "${deal.title}" — ${deal.commodity}, ${deal.currency} ${deal.value?.toLocaleString()}
Current status: ${deal.status}${deal.workflowPhase ? `, phase: ${deal.workflowPhase}` : ""}`,
      messages: [
        {
          role: "user",
          content: `Event: ${params.eventType}\nDetail: ${params.rawDetail}\n\nWrite a brief, contextual notification message.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.text || params.rawDetail;
  } catch (error) {
    logger.error("[AI] Smart notification generation failed", { error: String(error) });
    return params.rawDetail;
  }
}

/**
 * Analyze deal parameters and return a risk assessment.
 */
export async function assessDealRisk(dealId: string): Promise<{
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendation: string;
}> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      parties: {
        include: { user: { select: { name: true, createdAt: true } } },
      },
      documents: { select: { type: true } },
    },
  });

  if (!deal) throw new Error("Deal not found");

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are a deal risk assessment engine for DealVault, a commodity trading platform.
Analyze the deal and return a JSON object with: score (0-100), level (low/medium/high/critical), factors (array of risk factor strings), recommendation (1 sentence).
Consider: deal value, commodity type, number of parties, party verification status, document completeness, account age of parties.
Return ONLY valid JSON, no markdown.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          dealNumber: deal.dealNumber,
          commodity: deal.commodity,
          value: deal.value,
          currency: deal.currency,
          quantity: `${deal.quantity} ${deal.unit}`,
          status: deal.status,
          partyCount: deal.parties.length,
          parties: deal.parties.map((p) => ({
            role: p.role,
            status: p.status,
            accountAge: Math.floor(
              (Date.now() - new Date(p.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ) + " days",
          })),
          documentsUploaded: deal.documents.map((d) => d.type),
          requiredDocs: ["SPA", "NCNDA", "IMFPA", "BCL", "POF"],
          missingDocs: ["SPA", "NCNDA", "IMFPA", "BCL", "POF"].filter(
            (doc) => !deal.documents.some((d) => d.type === doc)
          ),
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  try {
    return JSON.parse(textBlock?.text || "{}");
  } catch {
    return {
      score: 50,
      level: "medium",
      factors: ["Unable to perform automated risk assessment"],
      recommendation: "Manual review recommended.",
    };
  }
}

/**
 * Document Intelligence — extract key fields from an uploaded document.
 * Analyzes document name, type, and context to suggest deal field values.
 */
export async function extractDocumentFields(params: {
  documentName: string;
  documentType: string;
  dealCommodity: string;
  dealTitle: string;
  existingParties: string[];
}): Promise<{
  extractedFields: Record<string, string>;
  confidence: "low" | "medium" | "high";
  summary: string;
}> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are a document analysis engine for DealVault, a commodity trading platform.
Given a document's metadata, infer what fields it likely contains and return structured data.
Return ONLY valid JSON with: extractedFields (key-value pairs of field names to expected values), confidence (low/medium/high), summary (1 sentence about the document).
Common document types: SPA (Sale Purchase Agreement), NCNDA (Non-Circumvention), IMFPA (Irrevocable Master Fee Protection), BCL (Bank Comfort Letter), POF (Proof of Funds), FCO (Full Corporate Offer), ICPO (Irrevocable Corporate Purchase Order).
For each type, extract likely fields: parties involved, dates, amounts, commodity specs, terms.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          documentName: params.documentName,
          documentType: params.documentType,
          dealCommodity: params.dealCommodity,
          dealTitle: params.dealTitle,
          knownParties: params.existingParties,
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  try {
    return JSON.parse(textBlock?.text || "{}");
  } catch {
    return {
      extractedFields: {},
      confidence: "low",
      summary: `Document "${params.documentName}" uploaded as ${params.documentType}.`,
    };
  }
}

/**
 * Anomaly Detection — analyze a deal for suspicious patterns.
 */
export async function detectAnomalies(dealId: string): Promise<{
  anomalies: Array<{
    type: string;
    severity: "info" | "warning" | "critical";
    description: string;
  }>;
  overallRisk: "normal" | "elevated" | "suspicious";
}> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      parties: {
        include: { user: { select: { name: true, createdAt: true } } },
      },
      documents: { select: { type: true, createdAt: true } },
      timeline: {
        orderBy: { createdAt: "asc" },
        select: { eventType: true, createdAt: true, description: true },
      },
      commissionLedger: {
        select: { agreedPct: true, calculatedAmount: true },
      },
      custodyLog: {
        include: {
          checkpoints: {
            select: { checkpointType: true, weight: true, weightUnit: true, isComplete: true },
          },
        },
      },
    },
  });

  if (!deal) throw new Error("Deal not found");

  // Calculate timeline velocity
  const timelineEvents = deal.timeline.map((t) => ({
    event: t.eventType,
    at: t.createdAt,
    description: t.description,
  }));

  // Check weight variances in custody
  const checkpoints = deal.custodyLog?.checkpoints || [];
  const weights = checkpoints
    .filter((cp) => cp.weight != null)
    .map((cp) => ({ type: cp.checkpointType, weight: cp.weight, unit: cp.weightUnit }));

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are an anomaly detection engine for DealVault, a commodity trading platform.
Analyze the deal data for suspicious patterns and return ONLY valid JSON with:
- anomalies: array of { type (string), severity (info|warning|critical), description (string) }
- overallRisk: "normal" | "elevated" | "suspicious"

Check for:
1. Weight variances between custody checkpoints (>2% is warning, >5% critical)
2. Unusually fast deal progression (all phases in <24h is suspicious)
3. Commission percentages outside market norms (>5% individual is unusual)
4. New accounts (created <7 days ago) in high-value deals
5. Missing critical documents (SPA, NCNDA required for deals >$100k)
6. Parties that haven't accepted invitations for >7 days`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          dealNumber: deal.dealNumber,
          commodity: deal.commodity,
          value: deal.value,
          currency: deal.currency,
          status: deal.status,
          createdAt: deal.createdAt,
          parties: deal.parties.map((p) => ({
            role: p.role,
            status: p.status,
            accountCreated: p.user.createdAt,
          })),
          documents: deal.documents.map((d) => ({ type: d.type, uploaded: d.createdAt })),
          timelineEvents,
          commission: deal.commissionLedger.map((c) => ({
            pct: c.agreedPct,
            amount: c.calculatedAmount,
          })),
          custodyWeights: weights,
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  try {
    return JSON.parse(textBlock?.text || "{}");
  } catch {
    return {
      anomalies: [],
      overallRisk: "normal",
    };
  }
}
