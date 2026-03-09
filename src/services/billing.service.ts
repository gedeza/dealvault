/**
 * Billing Service — Paystack subscription management.
 *
 * Tier definitions (mining-heritage naming from REVENUE-MODEL.md):
 *   prospect   — Entry tier: 5 deals, 3 users, 5 GB, up to $2M
 *   reef       — Hero tier: 20 deals, 10 users, 25 GB, escrow workflow
 *   sovereign  — Premium: 75 deals, 30 users, 100 GB, chain of custody
 *   vault      — Enterprise: unlimited, custom, sales-led
 *
 * Environment: PAYSTACK_SECRET_KEY, PAYSTACK_REEF_PLAN_CODE, PAYSTACK_SOVEREIGN_PLAN_CODE, PAYSTACK_WEBHOOK_SECRET
 */

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const PAYSTACK_BASE = "https://api.paystack.co";

function getPaystackKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

async function paystackRequest<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const key = getPaystackKey();
  if (!key) throw new Error("Paystack not configured");

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || `Paystack API error: ${res.status}`);
  }
  return data.data as T;
}

export type SubscriptionTier = "prospect" | "reef" | "sovereign" | "vault";

export interface TierLimits {
  maxActiveDeals: number;
  maxSeats: number;
  maxPartiesPerDeal: number;
  storageGB: number;
  dealValueCap: number | null; // null = unlimited
  escrowWorkflow: boolean;
  chainOfCustody: boolean;
  apiAccess: boolean;
  apiDailyLimit: number | null;
  complianceReporting: boolean;
  advancedReporting: boolean;
  webhooks: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  prospect: {
    maxActiveDeals: 5,
    maxSeats: 3,
    maxPartiesPerDeal: 6,
    storageGB: 5,
    dealValueCap: 2_000_000,
    escrowWorkflow: false,
    chainOfCustody: false,
    apiAccess: false,
    apiDailyLimit: null,
    complianceReporting: false,
    advancedReporting: false,
    webhooks: false,
  },
  reef: {
    maxActiveDeals: 20,
    maxSeats: 10,
    maxPartiesPerDeal: 12,
    storageGB: 25,
    dealValueCap: 15_000_000,
    escrowWorkflow: true,
    chainOfCustody: false,
    apiAccess: false,
    apiDailyLimit: null,
    complianceReporting: false,
    advancedReporting: true,
    webhooks: true,
  },
  sovereign: {
    maxActiveDeals: 75,
    maxSeats: 30,
    maxPartiesPerDeal: 999,
    storageGB: 100,
    dealValueCap: 50_000_000,
    escrowWorkflow: true,
    chainOfCustody: true,
    apiAccess: true,
    apiDailyLimit: 10_000,
    complianceReporting: true,
    advancedReporting: true,
    webhooks: true,
  },
  vault: {
    maxActiveDeals: 999,
    maxSeats: 999,
    maxPartiesPerDeal: 999,
    storageGB: 1000,
    dealValueCap: null,
    escrowWorkflow: true,
    chainOfCustody: true,
    apiAccess: true,
    apiDailyLimit: null,
    complianceReporting: true,
    advancedReporting: true,
    webhooks: true,
  },
};

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status === "cancelled") return "prospect";
  if (sub.status === "active" || sub.status === "trialing") {
    return sub.tier as SubscriptionTier;
  }
  return "prospect";
}

export async function getUserLimits(userId: string): Promise<TierLimits> {
  const tier = await getUserTier(userId);
  return TIER_LIMITS[tier];
}

/**
 * Initialize a Paystack transaction for subscription checkout.
 * Paystack handles the hosted payment page — we get a URL to redirect the user to.
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  targetTier: SubscriptionTier = "reef"
): Promise<string | null> {
  const key = getPaystackKey();
  if (!key) {
    logger.warn("[Billing] Paystack not configured");
    return null;
  }

  const planCode =
    targetTier === "sovereign"
      ? process.env.PAYSTACK_SOVEREIGN_PLAN_CODE
      : process.env.PAYSTACK_REEF_PLAN_CODE;

  if (!planCode) {
    logger.warn(`[Billing] PAYSTACK_${targetTier.toUpperCase()}_PLAN_CODE not set`);
    return null;
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Find or create Paystack customer
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerCode = sub?.providerCustomerId;

  if (!customerCode) {
    try {
      const customer = await paystackRequest<{ customer_code: string }>(
        "POST",
        "/customer",
        {
          email: userEmail,
          metadata: { userId },
        }
      );
      customerCode = customer.customer_code;
    } catch (err) {
      logger.error("[Billing] Failed to create Paystack customer", { err });
      return null;
    }

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          userId,
          tier: "prospect",
          status: "active",
          provider: "paystack",
          providerCustomerId: customerCode,
          providerEmail: userEmail,
        },
      });
    } else {
      await prisma.subscription.update({
        where: { userId },
        data: {
          providerCustomerId: customerCode,
          provider: "paystack",
          providerEmail: userEmail,
        },
      });
    }
  }

  // Initialize transaction with plan
  try {
    const transaction = await paystackRequest<{ authorization_url: string; reference: string }>(
      "POST",
      "/transaction/initialize",
      {
        email: userEmail,
        plan: planCode,
        callback_url: `${baseUrl}/profile?billing=success`,
        metadata: {
          userId,
          targetTier,
          cancel_action: `${baseUrl}/profile?billing=cancelled`,
        },
        channels: ["card", "bank", "eft"],
      }
    );

    return transaction.authorization_url;
  } catch (err) {
    logger.error("[Billing] Failed to initialize Paystack transaction", { err });
    return null;
  }
}

/**
 * Get a Paystack subscription management link.
 * Paystack provides a manage link for customers to update card details.
 */
export async function createPortalSession(userId: string): Promise<string | null> {
  const key = getPaystackKey();
  if (!key) return null;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.providerSubscriptionId) return null;

  try {
    const data = await paystackRequest<{ link: string }>(
      "GET",
      `/subscription/${sub.providerSubscriptionId}/manage/link`
    );
    return data.link;
  } catch (err) {
    logger.error("[Billing] Failed to get Paystack manage link", { err });
    return null;
  }
}

/**
 * Verify Paystack webhook signature using SHA-512 HMAC.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

/**
 * Handle Paystack webhook events.
 *
 * Key events:
 * - subscription.create — new subscription activated
 * - charge.success — successful payment (including subscription renewal)
 * - subscription.not_renew — customer cancelled auto-renewal
 * - subscription.disable — subscription deactivated
 * - invoice.create — new invoice generated
 * - invoice.payment_failed — payment attempt failed
 */
export async function handlePaystackWebhook(
  body: string,
  signature: string
): Promise<void> {
  if (!verifyWebhookSignature(body, signature)) {
    throw new Error("Invalid webhook signature");
  }

  const payload = JSON.parse(body);
  const { event, data } = payload;

  switch (event) {
    case "subscription.create": {
      const userId = data.metadata?.userId || data.customer?.metadata?.userId;
      const planCode = data.plan?.plan_code;

      // Determine tier from plan code
      const tier = getTierFromPlanCode(planCode);

      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            tier,
            status: "active",
            provider: "paystack",
            providerCustomerId: data.customer?.customer_code,
            providerSubscriptionId: data.subscription_code,
            providerPlanCode: planCode,
            currentPeriodStart: data.createdAt ? new Date(data.createdAt) : new Date(),
            currentPeriodEnd: data.next_payment_date
              ? new Date(data.next_payment_date)
              : undefined,
          },
          update: {
            tier,
            status: "active",
            providerSubscriptionId: data.subscription_code,
            providerPlanCode: planCode,
            currentPeriodStart: new Date(),
            currentPeriodEnd: data.next_payment_date
              ? new Date(data.next_payment_date)
              : undefined,
          },
        });
        logger.info("[Billing] Subscription activated", { userId, tier });
      }
      break;
    }

    case "charge.success": {
      // Handle successful charge — could be initial or renewal
      const customerCode = data.customer?.customer_code;
      if (!customerCode) break;

      const sub = await prisma.subscription.findUnique({
        where: { providerCustomerId: customerCode },
      });

      if (sub) {
        // Record payment as invoice
        const existingInvoice = await prisma.invoice.findUnique({
          where: { providerInvoiceId: data.reference },
        });

        if (!existingInvoice) {
          await prisma.invoice.create({
            data: {
              subscriptionId: sub.id,
              providerInvoiceId: data.reference,
              amount: (data.amount || 0) / 100, // Paystack amounts are in kobo/cents
              currency: (data.currency || "ZAR").toUpperCase(),
              status: "paid",
              paidAt: new Date(),
            },
          });
        }

        // Ensure subscription is active
        if (sub.status !== "active") {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "active" },
          });
        }
      }
      break;
    }

    case "subscription.not_renew": {
      // Customer cancelled but subscription still active until end of period
      const subCode = data.subscription_code;
      if (subCode) {
        await prisma.subscription.updateMany({
          where: { providerSubscriptionId: subCode },
          data: {
            // Keep active until period ends, mark cancellation intent
            cancelledAt: new Date(),
          },
        });
        logger.info("[Billing] Subscription set to not renew", { subCode });
      }
      break;
    }

    case "subscription.disable": {
      // Subscription fully deactivated
      const subCode = data.subscription_code;
      if (subCode) {
        await prisma.subscription.updateMany({
          where: { providerSubscriptionId: subCode },
          data: {
            status: "cancelled",
            tier: "prospect",
            cancelledAt: new Date(),
          },
        });
        logger.info("[Billing] Subscription cancelled", { subCode });
      }
      break;
    }

    case "invoice.payment_failed": {
      const customerCode = data.customer?.customer_code;
      if (customerCode) {
        await prisma.subscription.updateMany({
          where: { providerCustomerId: customerCode },
          data: { status: "past_due" },
        });
        logger.warn("[Billing] Payment failed", { customerCode });
      }
      break;
    }

    default:
      logger.info("[Billing] Unhandled webhook event", { event });
  }
}

/**
 * Map Paystack plan code to DealVault tier.
 */
function getTierFromPlanCode(planCode: string | undefined): SubscriptionTier {
  if (!planCode) return "reef"; // default upgrade tier

  const reefPlan = process.env.PAYSTACK_REEF_PLAN_CODE;
  const sovereignPlan = process.env.PAYSTACK_SOVEREIGN_PLAN_CODE;

  if (planCode === sovereignPlan) return "sovereign";
  if (planCode === reefPlan) return "reef";

  return "reef";
}
