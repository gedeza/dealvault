import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// DELETE /api/webhooks/[id] — Delete a webhook
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook || webhook.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

// PATCH /api/webhooks/[id] — Toggle webhook active status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook || webhook.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      active: body.active ?? !webhook.active,
      ...(body.events && { events: body.events }),
      ...(body.url && { url: body.url }),
      failCount: 0,
    },
  });

  return NextResponse.json(updated);
}
