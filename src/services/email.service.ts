import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // In development, log to console
  if (process.env.NODE_ENV !== "production") {
    logger.info("[Email] Dev mode — not sending", {
      to: payload.to,
      subject: payload.subject,
    });
    return true;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "DealVault <noreply@dealvault.co.za>";

  if (!apiKey) {
    logger.error("[Email] RESEND_API_KEY not configured — email not sent", {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logger.error("[Email] Resend API error", { status: res.status, error });
      return false;
    }

    logger.info("[Email] Sent successfully", { to: payload.to, subject: payload.subject });
    return true;
  } catch (error) {
    logger.error("[Email] Failed to send", { error: String(error) });
    return false;
  }
}

export function partyInviteEmail(params: {
  inviteeName: string;
  dealTitle: string;
  dealNumber: string;
  role: string;
  inviterName: string;
  dealUrl: string;
}): EmailPayload {
  return {
    to: "",
    subject: `DealVault: You've been invited to ${params.dealTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">DealVault</h2>
        <p>Hi ${params.inviteeName},</p>
        <p><strong>${params.inviterName}</strong> has invited you to join deal room <strong>${params.dealNumber}</strong> as a <strong>${params.role}</strong>.</p>
        <p><strong>Deal:</strong> ${params.dealTitle}</p>
        <p style="margin: 24px 0;">
          <a href="${params.dealUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Deal Room
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">If you don't have a DealVault account, you'll need to register first.</p>
      </div>
    `,
  };
}

export function statusChangeEmail(params: {
  recipientName: string;
  dealTitle: string;
  dealNumber: string;
  newStatus: string;
  dealUrl: string;
}): EmailPayload {
  return {
    to: "",
    subject: `DealVault: ${params.dealTitle} status updated`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">DealVault</h2>
        <p>Hi ${params.recipientName},</p>
        <p>Deal <strong>${params.dealNumber}</strong> ("${params.dealTitle}") has been updated to <strong>${params.newStatus}</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${params.dealUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Deal Room
          </a>
        </p>
      </div>
    `,
  };
}

export function documentUploadEmail(params: {
  recipientName: string;
  dealTitle: string;
  dealNumber: string;
  documentName: string;
  uploaderName: string;
  dealUrl: string;
}): EmailPayload {
  return {
    to: "",
    subject: `DealVault: New document uploaded to ${params.dealTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">DealVault</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.uploaderName}</strong> uploaded a new document to deal <strong>${params.dealNumber}</strong>.</p>
        <p><strong>Document:</strong> ${params.documentName}</p>
        <p style="margin: 24px 0;">
          <a href="${params.dealUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Deal Room
          </a>
        </p>
      </div>
    `,
  };
}

/**
 * Send transactional emails to deal parties when events occur.
 * Runs in the background (fire-and-forget) to not block API responses.
 */
export async function sendDealEventEmail(params: {
  dealId: string;
  excludeUserId?: string;
  specificUserIds?: string[];
  eventType: "status_changed" | "party_invited" | "document_uploaded" | "message_sent";
  dealTitle: string;
  dealNumber: string;
  actorName: string;
  detail: string;
}): Promise<void> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dealUrl = `${baseUrl}/deals/${params.dealId}`;

    let recipients: { id: string; name: string | null; email: string }[];

    if (params.specificUserIds) {
      recipients = await prisma.user.findMany({
        where: { id: { in: params.specificUserIds } },
        select: { id: true, name: true, email: true },
      });
    } else {
      const parties = await prisma.dealParty.findMany({
        where: { dealId: params.dealId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      const deal = await prisma.deal.findUnique({
        where: { id: params.dealId },
        include: { creator: { select: { id: true, name: true, email: true } } },
      });

      const userMap = new Map<string, { id: string; name: string | null; email: string }>();
      for (const p of parties) {
        userMap.set(p.user.id, p.user);
      }
      if (deal?.creator) {
        userMap.set(deal.creator.id, deal.creator);
      }
      if (params.excludeUserId) {
        userMap.delete(params.excludeUserId);
      }
      recipients = [...userMap.values()];
    }

    const subjectMap = {
      status_changed: `DealVault: ${params.dealTitle} — ${params.detail}`,
      party_invited: `DealVault: You've been invited to ${params.dealTitle}`,
      document_uploaded: `DealVault: New document in ${params.dealTitle}`,
      message_sent: `DealVault: New message in ${params.dealTitle}`,
    };

    for (const recipient of recipients) {
      const email: EmailPayload = {
        to: recipient.email,
        subject: subjectMap[params.eventType],
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">DealVault</h2>
            <p>Hi ${recipient.name || "there"},</p>
            <p><strong>${params.actorName}</strong> — ${params.detail}</p>
            <p><strong>Deal:</strong> ${params.dealNumber} — ${params.dealTitle}</p>
            <p style="margin: 24px 0;">
              <a href="${dealUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                View Deal Room
              </a>
            </p>
            <p style="color: #666; font-size: 12px;">You received this because you're a party to this deal.</p>
          </div>
        `,
      };
      // Fire-and-forget — don't await each email
      sendEmail(email).catch((err) =>
        logger.error("[Email] Failed to send deal event email", { error: String(err) })
      );
    }
  } catch (error) {
    logger.error("[Email] sendDealEventEmail failed", { error: String(error) });
  }
}

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
}): EmailPayload {
  return {
    to: "",
    subject: "DealVault: Password Reset",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">DealVault</h2>
        <p>Hi ${params.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${params.resetUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };
}
