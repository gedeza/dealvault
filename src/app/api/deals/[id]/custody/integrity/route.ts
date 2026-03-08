import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserWorkflowRole } from "@/services/workflow.service";
import { computeIntegrityChain } from "@/services/custody.service";
import { checkFeatureGate } from "@/lib/tier-guard";

// GET /api/deals/[id]/custody/integrity — Get full integrity chain for a deal
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const gate = await checkFeatureGate(session.user.id, "chainOfCustody", "Chain of Custody", "sovereign");
    if (gate) return gate;

  const { id } = await params;

  const role = await getUserWorkflowRole(session.user.id, id);
  if (!role) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const chain = await computeIntegrityChain(id);
  if (!chain) {
    return NextResponse.json(
      { error: "No custody log found for this deal" },
      { status: 404 }
    );
  }

  return NextResponse.json(chain);
}
