/**
 * Integration tests for Currency utilities.
 */

import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  formatCurrency,
  convertCurrency,
  toUSDEquivalent,
} from "@/lib/currency";

describe("Currency Utils", () => {
  it("has 10 supported currencies", () => {
    expect(SUPPORTED_CURRENCIES).toHaveLength(10);
  });

  it("formats USD correctly", () => {
    const formatted = formatCurrency(1000000, "USD");
    expect(formatted).toContain("1,000,000");
    expect(formatted).toContain("$");
  });

  it("converts between currencies with rates", () => {
    const rates: Record<string, number> = { EUR: 0.85, GBP: 0.73 };
    const result = convertCurrency(1000, "USD", "EUR", rates);
    expect(result).toBe(850);
  });

  it("returns same amount for same currency conversion", () => {
    const rates: Record<string, number> = {};
    const result = convertCurrency(1000, "USD", "USD", rates);
    expect(result).toBe(1000);
  });

  it("toUSDEquivalent returns rough estimate", () => {
    const usd = toUSDEquivalent(1000, "USD");
    expect(usd).toBe(1000);

    const zar = toUSDEquivalent(18500, "ZAR");
    expect(zar).toBe(1000); // ROUGH_USD_RATES.ZAR = 18.5
  });
});
