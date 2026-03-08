/**
 * Integration tests for Cloud Storage module.
 * Tests R2 configuration detection.
 */

import { describe, it, expect } from "vitest";
import { isR2Enabled } from "@/lib/cloud-storage";

describe("Cloud Storage (R2)", () => {
  it("R2 is disabled when env vars are not set", () => {
    // In test environment, R2 env vars should not be set
    expect(isR2Enabled()).toBe(false);
  });

  it("module exports required functions", async () => {
    const mod = await import("@/lib/cloud-storage");
    expect(mod.isR2Enabled).toBeDefined();
    expect(mod.uploadToR2).toBeDefined();
    expect(mod.downloadFromR2).toBeDefined();
    expect(mod.deleteFromR2).toBeDefined();
  });
});
