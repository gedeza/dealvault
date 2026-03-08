import { describe, it, expect } from "vitest";
import {
  partyInviteEmail,
  statusChangeEmail,
  passwordResetEmail,
  documentUploadEmail,
} from "@/services/email.service";

describe("Email templates", () => {
  it("generates party invite email with correct fields", () => {
    const email = partyInviteEmail({
      inviteeName: "John",
      dealTitle: "Gold Deal #1",
      dealNumber: "DV-2026-0001",
      role: "buyer",
      inviterName: "Alice",
      dealUrl: "http://localhost:3000/deals/abc",
    });

    expect(email.subject).toContain("Gold Deal #1");
    expect(email.html).toContain("John");
    expect(email.html).toContain("Alice");
    expect(email.html).toContain("buyer");
    expect(email.html).toContain("DV-2026-0001");
    expect(email.html).toContain("http://localhost:3000/deals/abc");
  });

  it("generates status change email", () => {
    const email = statusChangeEmail({
      recipientName: "Bob",
      dealTitle: "Diamond Trade",
      dealNumber: "DV-2026-0002",
      newStatus: "verified",
      dealUrl: "http://localhost:3000/deals/xyz",
    });

    expect(email.subject).toContain("Diamond Trade");
    expect(email.html).toContain("Bob");
    expect(email.html).toContain("verified");
  });

  it("generates password reset email with expiry notice", () => {
    const email = passwordResetEmail({
      name: "Jane",
      resetUrl: "http://localhost:3000/reset?token=abc123",
    });

    expect(email.subject).toContain("Password Reset");
    expect(email.html).toContain("Jane");
    expect(email.html).toContain("1 hour");
    expect(email.html).toContain("abc123");
  });

  it("generates document upload email", () => {
    const email = documentUploadEmail({
      recipientName: "Sam",
      dealTitle: "Platinum Export",
      dealNumber: "DV-2026-0003",
      documentName: "SPA_Contract.pdf",
      uploaderName: "Alice",
      dealUrl: "http://localhost:3000/deals/def",
    });

    expect(email.subject).toContain("Platinum Export");
    expect(email.html).toContain("Sam");
    expect(email.html).toContain("Alice");
    expect(email.html).toContain("SPA_Contract.pdf");
  });

  it("all templates use emerald brand color", () => {
    const templates = [
      partyInviteEmail({
        inviteeName: "X", dealTitle: "T", dealNumber: "D", role: "buyer", inviterName: "Y", dealUrl: "/",
      }),
      statusChangeEmail({
        recipientName: "X", dealTitle: "T", dealNumber: "D", newStatus: "s", dealUrl: "/",
      }),
      passwordResetEmail({ name: "X", resetUrl: "/" }),
      documentUploadEmail({
        recipientName: "X", dealTitle: "T", dealNumber: "D", documentName: "f", uploaderName: "Y", dealUrl: "/",
      }),
    ];

    for (const template of templates) {
      expect(template.html).toContain("#059669");
    }
  });
});
