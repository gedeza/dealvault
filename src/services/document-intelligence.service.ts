/**
 * Document Intelligence Service — OCR + AI field extraction.
 *
 * Uses Google Cloud Vision API for OCR text extraction from PDFs and images,
 * then feeds the extracted text to Claude for structured field extraction.
 *
 * Falls back to metadata-only analysis when Vision API is not configured.
 *
 * Environment: GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 */

import { logger } from "@/lib/logger";
import path from "path";
import { readFile } from "fs/promises";

interface ExtractionResult {
  extractedFields: Record<string, string>;
  confidence: "low" | "medium" | "high";
  summary: string;
  ocrText?: string;
}

async function extractTextWithVision(filePath: string): Promise<string | null> {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return null;
  }

  try {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const client = new ImageAnnotatorClient();

    const ext = path.extname(filePath).toLowerCase();
    const fullPath = filePath.startsWith("/") ? filePath : path.join(process.cwd(), filePath);
    const fileBuffer = await readFile(fullPath);

    if (ext === ".pdf") {
      // Use document text detection for PDFs
      const [result] = await client.documentTextDetection({
        image: { content: fileBuffer },
      });
      return result.fullTextAnnotation?.text || null;
    }

    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      const [result] = await client.textDetection({
        image: { content: fileBuffer },
      });
      const detections = result.textAnnotations;
      return detections?.[0]?.description || null;
    }

    return null;
  } catch (err) {
    logger.error("[DocIntel] Vision API extraction failed", { error: String(err), filePath });
    return null;
  }
}

async function extractFieldsWithAI(
  ocrText: string,
  documentName: string,
  documentType: string,
  dealCommodity: string,
  dealTitle: string,
  existingParties: string[]
): Promise<ExtractionResult> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("No API key");

    const client = new Anthropic({ apiKey });

    // Truncate OCR text to first 4000 chars to stay within token limits
    const truncatedText = ocrText.length > 4000 ? ocrText.slice(0, 4000) + "\n...[truncated]" : ocrText;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a document analysis engine for DealVault, a commodity trading platform.
Extract structured key-value fields from the document text. Return ONLY valid JSON with:
- extractedFields: object of field names to extracted values
- confidence: "low" | "medium" | "high"
- summary: 1 sentence summary of the document

Common document types: SPA (Sale Purchase Agreement), NCNDA (Non-Circumvention), IMFPA (Irrevocable Master Fee Protection), BCL (Bank Comfort Letter), POF (Proof of Funds), FCO (Full Corporate Offer), ICPO (Irrevocable Corporate Purchase Order), Assay Report, Certificate of Origin.

Extract fields like: party names, dates, amounts, commodity type/weight/purity, terms, certificate numbers, inspector names, bank names, account numbers (redact last 4 digits only).`,
      messages: [
        {
          role: "user",
          content: `Document: "${documentName}" (type: ${documentType})
Deal: "${dealTitle}" — Commodity: ${dealCommodity}
Known parties: ${existingParties.join(", ")}

--- DOCUMENT TEXT ---
${truncatedText}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");

    return {
      extractedFields: parsed.extractedFields || {},
      confidence: parsed.confidence || "medium",
      summary: parsed.summary || `Extracted fields from ${documentName}`,
      ocrText: truncatedText,
    };
  } catch (err) {
    logger.error("[DocIntel] AI field extraction failed", { error: String(err) });
    return {
      extractedFields: {},
      confidence: "low",
      summary: `Document "${documentName}" uploaded as ${documentType}.`,
    };
  }
}

/**
 * Full document intelligence pipeline:
 * 1. OCR via Google Cloud Vision (if configured)
 * 2. AI field extraction via Claude (with real text or metadata fallback)
 */
export async function analyzeDocument(params: {
  filePath: string;
  documentName: string;
  documentType: string;
  dealCommodity: string;
  dealTitle: string;
  existingParties: string[];
}): Promise<ExtractionResult> {
  // Step 1: Try OCR extraction
  const ocrText = await extractTextWithVision(params.filePath);

  if (ocrText) {
    logger.info("[DocIntel] OCR text extracted", {
      document: params.documentName,
      textLength: ocrText.length,
    });

    // Step 2: AI extraction with real document text
    return extractFieldsWithAI(
      ocrText,
      params.documentName,
      params.documentType,
      params.dealCommodity,
      params.dealTitle,
      params.existingParties
    );
  }

  // Fallback: metadata-only analysis (existing behavior)
  logger.info("[DocIntel] No OCR available, using metadata analysis", {
    document: params.documentName,
  });

  try {
    const { extractDocumentFields } = await import("@/services/ai.service");
    return await extractDocumentFields({
      documentName: params.documentName,
      documentType: params.documentType,
      dealCommodity: params.dealCommodity,
      dealTitle: params.dealTitle,
      existingParties: params.existingParties,
    });
  } catch {
    return {
      extractedFields: {},
      confidence: "low",
      summary: `Document "${params.documentName}" uploaded as ${params.documentType}.`,
    };
  }
}
