import { describe, it, expect } from "vitest";
import { validateFile } from "@/lib/storage";

function mockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("File Upload Validation", () => {
  it("should accept valid PDF", () => {
    const file = mockFile("document.pdf", 1024, "application/pdf");
    expect(validateFile(file)).toBeNull();
  });

  it("should accept valid JPEG", () => {
    const file = mockFile("photo.jpg", 2048, "image/jpeg");
    expect(validateFile(file)).toBeNull();
  });

  it("should accept valid DOCX", () => {
    const file = mockFile("report.docx", 5000, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(validateFile(file)).toBeNull();
  });

  it("should reject executable files", () => {
    const file = mockFile("malware.exe", 1024, "application/x-msdownload");
    expect(validateFile(file)).toContain("not allowed");
  });

  it("should reject files over 25MB", () => {
    const file = mockFile("huge.pdf", 26 * 1024 * 1024, "application/pdf");
    expect(validateFile(file)).toContain("too large");
  });

  it("should reject shell scripts", () => {
    const file = mockFile("hack.sh", 100, "application/x-sh");
    expect(validateFile(file)).toContain("not allowed");
  });

  it("should reject PHP files", () => {
    const file = mockFile("shell.php", 100, "application/x-php");
    expect(validateFile(file)).toContain("not allowed");
  });

  it("should accept CSV files", () => {
    const file = mockFile("data.csv", 500, "text/csv");
    expect(validateFile(file)).toBeNull();
  });

  it("should accept PNG files", () => {
    const file = mockFile("image.png", 1024, "image/png");
    expect(validateFile(file)).toBeNull();
  });

  it("should reject files with no extension match", () => {
    const file = mockFile("binary.bin", 100, "application/octet-stream");
    expect(validateFile(file)).toContain("not allowed");
  });
});
