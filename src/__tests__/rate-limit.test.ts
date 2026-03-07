import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  it("should allow requests within limit", () => {
    const result = rateLimit("test-ip-1", "test1", { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests over limit", () => {
    const config = { windowMs: 60000, maxRequests: 3 };
    rateLimit("test-ip-2", "test2", config);
    rateLimit("test-ip-2", "test2", config);
    rateLimit("test-ip-2", "test2", config);
    const result = rateLimit("test-ip-2", "test2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track different IPs independently", () => {
    const config = { windowMs: 60000, maxRequests: 2 };
    rateLimit("ip-a", "test3", config);
    rateLimit("ip-a", "test3", config);
    const blocked = rateLimit("ip-a", "test3", config);
    const allowed = rateLimit("ip-b", "test3", config);

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });

  it("should track different buckets independently", () => {
    const config = { windowMs: 60000, maxRequests: 1 };
    rateLimit("ip-c", "bucket-a", config);
    const blockedA = rateLimit("ip-c", "bucket-a", config);
    const allowedB = rateLimit("ip-c", "bucket-b", config);

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});
