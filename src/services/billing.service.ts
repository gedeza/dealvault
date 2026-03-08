/**
 * Billing Service — Stripe subscription management.
 *
 * Tier definitions (mining-heritage naming from REVENUE-MODEL.md):
 *   prospect   — Entry tier: 5 deals, 3 users, 5 GB, up to $2M
 *   reef       — Hero tier: 20 deals, 10 users, 25 GB, escrow workflow
 *   sovereign  — Premium: 75 deals, 30 users, 100 GB, chain of custody
 *   vault      — Enterprise: unlimited, custom, sales-led
 *
 * Environment: STRIPE_SECRET_KEY, STRIPE_REEF_PRICE_ID, STRIPE_SOVEREIGN_PRICE_ID, STRIPE_WEBHOOK_SECRET
 */

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
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

export async function createCheckoutSession(
  userId: string,
  userEmail: string
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) {
    logger.warn("[Billing] Stripe not configured");
    return null;
  }

  const priceId = process.env.STRIPE_REEF_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    logger.warn("[Billing] STRIPE_REEF_PRICE_ID not set");
    return null;
  }

  // Find or create Stripe customer
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          userId,
          tier: "prospect",
          status: "active",
          stripeCustomerId: customerId,
        },
      });
    } else {
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/profile?billing=success`,
    cancel_url: `${baseUrl}/profile?billing=cancelled`,
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId },
    },
  });

  return session.url;
}

export async function createPortalSession(userId: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) return null;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/profile`,
  });

  return session.url;
}

export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return;

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.subscription
        ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.userId
        : null;

      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            tier: "reef",
            status: "active",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
          update: {
            tier: "reef",
            status: "active",
            stripeSubscriptionId: session.subscription as string,
          },
        });
        logger.info("[Billing] Subscription activated", { userId, tier: "reef" });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (sub) {
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
        };
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: statusMap[subscription.status] || "cancelled",
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "cancelled", tier: "prospect", cancelledAt: new Date() },
      });
      logger.info("[Billing] Subscription cancelled", { stripeSubId: subscription.id });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: invoice.customer as string },
      });

      if (sub) {
        await prisma.invoice.create({
          data: {
            subscriptionId: sub.id,
            stripeInvoiceId: invoice.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency?.toUpperCase() || "USD",
            status: "paid",
            paidAt: new Date(),
            invoiceUrl: invoice.hosted_invoice_url || null,
          },
        });
      }
      break;
    }
  }
}
