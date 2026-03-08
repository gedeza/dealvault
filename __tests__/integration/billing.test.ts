/**
 * Integration tests for the Billing Service.
 * Tests tier limits and configuration for 4-tier pricing model.
 */

import { describe, it, expect } from "vitest";
import { TIER_LIMITS } from "@/services/billing.service";
import type { SubscriptionTier } from "@/services/billing.service";

describe("Billing Service", () => {
  describe("TIER_LIMITS", () => {
    it("defines limits for all four tiers", () => {
      expect(TIER_LIMITS.prospect).toBeDefined();
      expect(TIER_LIMITS.reef).toBeDefined();
      expect(TIER_LIMITS.sovereign).toBeDefined();
      expect(TIER_LIMITS.vault).toBeDefined();
    });

    it("prospect tier has restricted features", () => {
      expect(TIER_LIMITS.prospect.escrowWorkflow).toBe(false);
      expect(TIER_LIMITS.prospect.chainOfCustody).toBe(false);
      expect(TIER_LIMITS.prospect.apiAccess).toBe(false);
      expect(TIER_LIMITS.prospect.maxActiveDeals).toBe(5);
      expect(TIER_LIMITS.prospect.maxSeats).toBe(3);
    });

    it("reef tier unlocks escrow workflow", () => {
      expect(TIER_LIMITS.reef.escrowWorkflow).toBe(true);
      expect(TIER_LIMITS.reef.chainOfCustody).toBe(false);
      expect(TIER_LIMITS.reef.advancedReporting).toBe(true);
      expect(TIER_LIMITS.reef.webhooks).toBe(true);
      expect(TIER_LIMITS.reef.maxActiveDeals).toBe(20);
    });

    it("sovereign tier unlocks chain of custody and compliance", () => {
      expect(TIER_LIMITS.sovereign.escrowWorkflow).toBe(true);
      expect(TIER_LIMITS.sovereign.chainOfCustody).toBe(true);
      expect(TIER_LIMITS.sovereign.complianceReporting).toBe(true);
      expect(TIER_LIMITS.sovereign.apiAccess).toBe(true);
      expect(TIER_LIMITS.sovereign.apiDailyLimit).toBe(10_000);
    });

    it("vault tier has highest limits", () => {
      expect(TIER_LIMITS.vault.storageGB).toBeGreaterThan(TIER_LIMITS.sovereign.storageGB);
      expect(TIER_LIMITS.vault.maxActiveDeals).toBeGreaterThan(TIER_LIMITS.sovereign.maxActiveDeals);
      expect(TIER_LIMITS.vault.dealValueCap).toBeNull(); // unlimited
      expect(TIER_LIMITS.vault.apiDailyLimit).toBeNull(); // unlimited
    });

    it("tiers enforce progressive deal value caps", () => {
      expect(TIER_LIMITS.prospect.dealValueCap).toBe(2_000_000);
      expect(TIER_LIMITS.reef.dealValueCap).toBe(15_000_000);
      expect(TIER_LIMITS.sovereign.dealValueCap).toBe(50_000_000);
      expect(TIER_LIMITS.vault.dealValueCap).toBeNull();
    });

    it("storage scales across tiers", () => {
      const tiers: SubscriptionTier[] = ["prospect", "reef", "sovereign", "vault"];
      for (let i = 1; i < tiers.length; i++) {
        expect(TIER_LIMITS[tiers[i]].storageGB).toBeGreaterThan(
          TIER_LIMITS[tiers[i - 1]].storageGB
        );
      }
    });
  });
});
