/**
 * Webhook Service — Dispatch deal events to external services.
 *
 * Supports: Slack (Block Kit), Teams (Adaptive Cards), Custom (raw JSON).
 * Retry: 3 attempts with exponential backoff (1s, 2s, 4s).
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";

interface WebhookPayload {
  event: string;
  dealId: string;
  dealNumber: string;
  dealTitle: string;
  detail: string;
  timestamp: string;
}

function buildSlackPayload(payload: WebhookPayload) {
  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `DealVault: ${payload.event.replace(/_/g, " ")}` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Deal:*\n${payload.dealNumber}` },
          { type: "mrkdwn", text: `*Title:*\n${payload.dealTitle}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.detail },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Sent from DealVault at ${payload.timestamp}` },
        ],
      },
    ],
  };
}

function buildTeamsPayload(payload: WebhookPayload) {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `DealVault: ${payload.event.replace(/_/g, " ")}`,
              weight: "Bolder",
              size: "Medium",
            },
            {
              type: "FactSet",
              facts: [
                { title: "Deal", value: payload.dealNumber },
                { title: "Title", value: payload.dealTitle },
              ],
            },
            {
              type: "TextBlock",
              text: payload.detail,
              wrap: true,
            },
            {
              type: "TextBlock",
              text: payload.timestamp,
              isSubtle: true,
              size: "Small",
            },
          ],
        },
      },
    ],
  };
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function sendWithRetry(
  url: string,
  body: unknown,
  secret: string | null,
  maxRetries = 3
): Promise<boolean> {
  const jsonBody = JSON.stringify(body);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (secret) {
        headers["X-DealVault-Signature"] = signPayload(jsonBody, secret);
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: jsonBody,
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) return true;

      logger.warn("[Webhook] Non-OK response", { url, status: res.status, attempt });
    } catch (err) {
      logger.warn("[Webhook] Request failed", { url, attempt, error: String(err) });
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  return false;
}

export async function dispatchWebhooks(params: {
  userId: string;
  event: string;
  dealId: string;
  dealNumber: string;
  dealTitle: string;
  detail: string;
}) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId: params.userId,
      active: true,
    },
  });

  const payload: WebhookPayload = {
    event: params.event,
    dealId: params.dealId,
    dealNumber: params.dealNumber,
    dealTitle: params.dealTitle,
    detail: params.detail,
    timestamp: new Date().toISOString(),
  };

  for (const webhook of webhooks) {
    // Check if webhook subscribes to this event
    const subscribedEvents = webhook.events.split(",").map((e) => e.trim());
    if (!subscribedEvents.includes("*") && !subscribedEvents.includes(params.event)) {
      continue;
    }

    let body: unknown;
    switch (webhook.platform) {
      case "slack":
        body = buildSlackPayload(payload);
        break;
      case "teams":
        body = buildTeamsPayload(payload);
        break;
      default:
        body = payload;
    }

    const success = await sendWithRetry(webhook.url, body, webhook.secret);

    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastFiredAt: new Date(),
        failCount: success ? 0 : { increment: 1 },
      },
    });

    if (!success) {
      logger.error("[Webhook] Delivery failed after retries", {
        webhookId: webhook.id,
        url: webhook.url,
        event: params.event,
      });

      // Auto-disable after 10 consecutive failures
      if (webhook.failCount >= 9) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { active: false },
        });
        logger.warn("[Webhook] Auto-disabled after 10 failures", { webhookId: webhook.id });
      }
    }
  }
}
