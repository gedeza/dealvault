import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { checkFeatureGate } from "@/lib/tier-guard";
import crypto from "crypto";

const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  platform: z.enum(["slack", "teams", "custom"]),
  events: z.string().min(1, "At least one event required"),
});

// GET /api/webhooks — List user's webhooks
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

// POST /api/webhooks — Create a new webhook
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = await checkFeatureGate(session.user.id, "webhooks", "Webhook Integrations", "reef");
  if (gate) return gate;

  try {
    const body = await req.json();
    const { url, platform, events } = createWebhookSchema.parse(body);

    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        url,
        platform,
        events,
        secret,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
