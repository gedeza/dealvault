import { describe, it, expect } from "vitest";
import { VALID_STATUS_TRANSITIONS, DEAL_STATUSES } from "@/types";

describe("Deal Status Transitions", () => {
  it("should define transitions for all statuses", () => {
    for (const status of DEAL_STATUSES) {
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty(status);
      expect(Array.isArray(VALID_STATUS_TRANSITIONS[status])).toBe(true);
    }
  });

  it("draft can only go to documents_pending or cancelled", () => {
    expect(VALID_STATUS_TRANSITIONS.draft).toEqual(["documents_pending", "cancelled"]);
  });

  it("closed has no transitions", () => {
    expect(VALID_STATUS_TRANSITIONS.closed).toEqual([]);
  });

  it("cancelled can return to draft", () => {
    expect(VALID_STATUS_TRANSITIONS.cancelled).toContain("draft");
  });

  it("settled can only go to closed", () => {
    expect(VALID_STATUS_TRANSITIONS.settled).toEqual(["closed"]);
  });

  it("should not allow direct draft to settled", () => {
    expect(VALID_STATUS_TRANSITIONS.draft).not.toContain("settled");
  });

  it("should not allow direct draft to closed", () => {
    expect(VALID_STATUS_TRANSITIONS.draft).not.toContain("closed");
  });

  it("all transition targets should be valid statuses", () => {
    const validStatuses = new Set(DEAL_STATUSES);
    for (const status of DEAL_STATUSES) {
      for (const target of VALID_STATUS_TRANSITIONS[status]) {
        expect(validStatuses.has(target)).toBe(true);
      }
    }
  });
});
