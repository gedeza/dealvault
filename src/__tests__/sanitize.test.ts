import { describe, it, expect } from "vitest";
import { sanitizeString, sanitizeObject } from "@/lib/sanitize";

describe("Input Sanitization", () => {
  it("should trim whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("should strip HTML tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).toBe("alert('xss')");
    expect(sanitizeString("<b>bold</b> text")).toBe("bold text");
  });

  it("should handle encoded HTML entities", () => {
    expect(sanitizeString("&lt;script&gt;alert('xss')&lt;/script&gt;")).toBe("alert('xss')");
  });

  it("should leave clean strings unchanged", () => {
    expect(sanitizeString("Gold Bullion Purchase")).toBe("Gold Bullion Purchase");
  });

  it("should sanitize object values recursively", () => {
    const input = {
      name: "  <b>Test</b>  ",
      count: 42,
      nested: { label: "<script>bad</script>" },
    };
    const result = sanitizeObject(input);
    expect(result.name).toBe("Test");
    expect(result.count).toBe(42);
    expect((result.nested as { label: string }).label).toBe("bad");
  });

  it("should handle empty strings", () => {
    expect(sanitizeString("")).toBe("");
  });
});
