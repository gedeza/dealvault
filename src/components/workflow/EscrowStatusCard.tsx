"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Circle, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  ESCROW_STATUS_LABELS,
  ESCROW_ACTION_ROLES,
  type EscrowStatus,
  type EscrowAction,
  type WorkflowRole,
} from "@/types/workflow";
import { cn } from "@/lib/utils";

interface EscrowRecord {
  id: string;
  currency: string;
  amount: number;
  status: string;
  referenceNumber: string | null;
  blockedAt: string | null;
  blockConfirmedAt: string | null;
  blockConfirmedBy: { name: string } | null;
  deliveryConfirmedAt: string | null;
  deliveryConfirmedBy: { name: string } | null;
  releasedAt: string | null;
  releasedBy: { name: string } | null;
  refundedAt: string | null;
  refundedBy: { name: string } | null;
}

interface EscrowStatusCardProps {
  dealId: string;
  escrow: EscrowRecord | null;
  userRole: WorkflowRole | null;
  onAction: () => void;
}

const ESCROW_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "blocked", label: "Funds Blocked" },
  { key: "block_confirmed", label: "Block Confirmed" },
  { key: "released", label: "Released" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  blocked: 1,
  block_confirmed: 2,
  released: 3,
  refunded: 3,
  disputed: -1,
};

export function EscrowStatusCard({
  dealId,
  escrow,
  userRole,
  onAction,
}: EscrowStatusCardProps) {
  const [loading, setLoading] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  if (!escrow) return null;

  const currentStep = STATUS_ORDER[escrow.status] ?? 0;

  const performAction = async (action: EscrowAction) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/workflow/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          referenceNumber: refNumber || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Escrow action "${action}" completed`);
        setRefNumber("");
        onAction();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const canPerform = (action: EscrowAction): boolean => {
    if (!userRole) return false;
    return ESCROW_ACTION_ROLES[action]?.includes(userRole) ?? false;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Escrow
          <Badge variant="outline">
            {escrow.currency} {escrow.amount.toLocaleString()}
          </Badge>
          <Badge
            className={cn(
              "ml-auto",
              escrow.status === "released" && "bg-green-100 text-green-800",
              escrow.status === "refunded" && "bg-amber-100 text-amber-800",
              escrow.status === "disputed" && "bg-red-100 text-red-800"
            )}
          >
            {ESCROW_STATUS_LABELS[escrow.status as EscrowStatus] || escrow.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress steps */}
        <div className="flex items-center gap-1">
          {ESCROW_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                      isCompleted && "bg-primary text-white",
                      isCurrent && "bg-blue-500 text-white",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 text-center",
                    isCurrent && "font-semibold",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < ESCROW_STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-full",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="text-sm space-y-1">
          {escrow.referenceNumber && (
            <p><span className="text-muted-foreground">Reference:</span> {escrow.referenceNumber}</p>
          )}
          {escrow.blockedAt && (
            <p><span className="text-muted-foreground">Blocked:</span> {new Date(escrow.blockedAt).toLocaleString()}</p>
          )}
          {escrow.blockConfirmedBy && (
            <p><span className="text-muted-foreground">Confirmed by:</span> {escrow.blockConfirmedBy.name} at {new Date(escrow.blockConfirmedAt!).toLocaleString()}</p>
          )}
          {escrow.deliveryConfirmedBy && (
            <p><span className="text-muted-foreground">Delivery confirmed by:</span> {escrow.deliveryConfirmedBy.name}</p>
          )}
          {escrow.releasedBy && (
            <p><span className="text-muted-foreground">Released by:</span> {escrow.releasedBy.name} at {new Date(escrow.releasedAt!).toLocaleString()}</p>
          )}
        </div>

        {/* Actions */}
        {escrow.status === "pending" && canPerform("block") && (
          <div className="flex gap-2">
            <Input
              placeholder="Bank/SWIFT reference number"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={loading || !refNumber}
              onClick={() => performAction("block")}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Block Funds"}
            </Button>
          </div>
        )}

        {escrow.status === "blocked" && canPerform("confirm_block") && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => performAction("confirm_block")}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
            Confirm Fund Blocking
          </Button>
        )}

        {escrow.status === "block_confirmed" && canPerform("confirm_delivery") && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => performAction("confirm_delivery")}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
            Confirm Delivery
          </Button>
        )}

        {escrow.status === "block_confirmed" && canPerform("release") && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => performAction("release")}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <DollarSign className="h-4 w-4 mr-1" />}
            Release Funds
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
