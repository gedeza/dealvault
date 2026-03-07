import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  registrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  country: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== session.user.id) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(company);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company || company.userId !== session.user.id) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = updateCompanySchema.parse(body);

    const updated = await prisma.company.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: { _count: { select: { dealParties: true } } },
  });

  if (!company || company.userId !== session.user.id) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (company._count.dealParties > 0) {
    return NextResponse.json(
      { error: "Cannot delete company linked to active deals" },
      { status: 400 }
    );
  }

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ message: "Company deleted" });
}
