-- Replace Stripe-specific fields with provider-agnostic fields for Paystack integration

-- DropIndex
DROP INDEX "Invoice_stripeInvoiceId_key";

-- DropIndex
DROP INDEX "Subscription_stripeCustomerId_idx";

-- DropIndex
DROP INDEX "Subscription_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "stripeInvoiceId",
ADD COLUMN     "providerInvoiceId" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'ZAR';

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'paystack',
ADD COLUMN     "providerCustomerId" TEXT,
ADD COLUMN     "providerEmail" TEXT,
ADD COLUMN     "providerPlanCode" TEXT,
ADD COLUMN     "providerSubscriptionId" TEXT,
ALTER COLUMN "tier" SET DEFAULT 'prospect';

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_providerInvoiceId_key" ON "Invoice"("providerInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerCustomerId_key" ON "Subscription"("providerCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_providerCustomerId_idx" ON "Subscription"("providerCustomerId");
