/**
 * Integration tests for the Compliance Service.
 * Tests framework selection, checklist initialization, and item updates.
 */

import { describe, it, expect } from "vitest";
import {
  getApplicableFrameworks,
  getFrameworkLabel,
  getAllFrameworkDefinitions,
} from "@/services/compliance.service";

describe("Compliance Service", () => {
  describe("getApplicableFrameworks", () => {
    it("returns SADPMR, FICA/AML, LBMA for gold", () => {
      const frameworks = getApplicableFrameworks("gold");
      expect(frameworks).toContain("sadpmr");
      expect(frameworks).toContain("fica_aml");
      expect(frameworks).toContain("lbma");
      expect(frameworks).not.toContain("kimberley_process");
    });

    it("returns SADPMR, FICA/AML, Kimberley for diamond", () => {
      const frameworks = getApplicableFrameworks("diamond");
      expect(frameworks).toContain("sadpmr");
      expect(frameworks).toContain("fica_aml");
      expect(frameworks).toContain("kimberley_process");
      expect(frameworks).not.toContain("lbma");
    });

    it("returns SADPMR, FICA/AML, LBMA for platinum", () => {
      const frameworks = getApplicableFrameworks("platinum");
      expect(frameworks).toContain("sadpmr");
      expect(frameworks).toContain("lbma");
    });

    it("returns only FICA/AML for tanzanite", () => {
      const frameworks = getApplicableFrameworks("tanzanite");
      expect(frameworks).toEqual(["fica_aml"]);
    });

    it("returns empty for unknown commodity", () => {
      const frameworks = getApplicableFrameworks("copper");
      expect(frameworks).toEqual([]);
    });

    it("is case-insensitive", () => {
      const upper = getApplicableFrameworks("GOLD");
      const lower = getApplicableFrameworks("gold");
      expect(upper).toEqual(lower);
    });
  });

  describe("getFrameworkLabel", () => {
    it("returns full label for known frameworks", () => {
      expect(getFrameworkLabel("sadpmr")).toContain("SADPMR");
      expect(getFrameworkLabel("fica_aml")).toContain("FICA");
      expect(getFrameworkLabel("kimberley_process")).toContain("Kimberley");
      expect(getFrameworkLabel("lbma")).toContain("LBMA");
    });

    it("returns raw key for unknown framework", () => {
      expect(getFrameworkLabel("unknown")).toBe("unknown");
    });
  });

  describe("getAllFrameworkDefinitions", () => {
    it("returns all 4 frameworks", () => {
      const defs = getAllFrameworkDefinitions();
      expect(Object.keys(defs)).toHaveLength(4);
    });

    it("each framework has requirements", () => {
      const defs = getAllFrameworkDefinitions();
      for (const [, def] of Object.entries(defs)) {
        expect(def.requirements.length).toBeGreaterThan(0);
        expect(def.commodities.length).toBeGreaterThan(0);
        expect(def.label).toBeTruthy();
      }
    });
  });
});
