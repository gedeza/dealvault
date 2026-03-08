/**
 * Integration tests for the Billing Service.
 * Tests tier limits and configuration.
 */

import { describe, it, expect } from "vitest";
import { TIER_LIMITS } from "@/services/billing.service";
import type { SubscriptionTier } from "@/services/billing.service";

describe("Billing Service", () => {
  describe("TIER_LIMITS", () => {
    it("defines limits for all three tiers", () => {
      expect(TIER_LIMITS.free).toBeDefined();
      expect(TIER_LIMITS.pro).toBeDefined();
      expect(TIER_LIMITS.enterprise).toBeDefined();
    });

    it("free tier has restricted AI features", () => {
      expect(TIER_LIMITS.free.aiFeatures).toBe(false);
      expect(TIER_LIMITS.free.advancedReporting).toBe(false);
    });

    it("pro tier unlocks AI and reporting", () => {
      expect(TIER_LIMITS.pro.aiFeatures).toBe(true);
      expect(TIER_LIMITS.pro.advancedReporting).toBe(true);
      expect(TIER_LIMITS.pro.webhooks).toBe(true);
    });

    it("enterprise tier has highest storage", () => {
      expect(TIER_LIMITS.enterprise.storageGB).toBeGreaterThan(TIER_LIMITS.pro.storageGB);
      expect(TIER_LIMITS.enterprise.storageGB).toBeGreaterThan(TIER_LIMITS.free.storageGB);
    });

    it("all tiers have SSE enabled", () => {
      const tiers: SubscriptionTier[] = ["free", "pro", "enterprise"];
      for (const tier of tiers) {
        expect(TIER_LIMITS[tier].realtimeSSE).toBe(true);
      }
    });
  });
});
