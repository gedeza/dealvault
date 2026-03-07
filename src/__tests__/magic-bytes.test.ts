import { describe, it, expect } from "vitest";
import { validateFileBytes } from "@/lib/storage";

describe("validateFileBytes – magic byte validation", () => {
  it("should accept valid PDF bytes with .pdf extension", () => {
    const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(validateFileBytes(buffer, ".pdf")).toBeNull();
  });

  it("should accept valid JPEG bytes with .jpg extension", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateFileBytes(buffer, ".jpg")).toBeNull();
  });

  it("should accept valid PNG bytes with .png extension", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(validateFileBytes(buffer, ".png")).toBeNull();
  });

  it("should reject PDF content with .jpg extension (mismatch)", () => {
    const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateFileBytes(buffer, ".jpg");
    expect(result).not.toBeNull();
    expect(result).toContain("does not match");
  });

  it("should skip validation for .txt extension", () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(validateFileBytes(buffer, ".txt")).toBeNull();
  });

  it("should reject random bytes with .pdf extension", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
    const result = validateFileBytes(buffer, ".pdf");
    expect(result).not.toBeNull();
    expect(result).toContain("does not match any allowed file type");
  });

  it("should reject empty buffer with .pdf extension", () => {
    const buffer = Buffer.alloc(0);
    const result = validateFileBytes(buffer, ".pdf");
    expect(result).not.toBeNull();
    expect(result).toContain("does not match any allowed file type");
  });
});
