"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  PHASE_TRANSITIONS,
  WORKFLOW_PHASE_LABELS,
  PHASE_GATE_LABELS,
  type WorkflowPhase,
  type WorkflowRole,
  type PhaseGate,
} from "@/types/workflow";

interface PhaseActionPanelProps {
  dealId: string;
  currentPhase: WorkflowPhase;
  userRole: WorkflowRole | null;
  pendingApprovals: {
    phase: string;
    requiredRole: string;
    status: string;
  }[];
  missingGates: string[];
  onAction: () => void;
}

export function PhaseActionPanel({
  dealId,
  currentPhase,
  userRole,
  pendingApprovals,
  missingGates,
  onAction,
}: PhaseActionPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  if (!userRole) return null;

  const rules = PHASE_TRANSITIONS[currentPhase] || [];
  const availableTransitions = rules.filter((r) =>
    r.triggeredBy.includes(userRole)
  );

  // Check if user has a pending approval at current phase
  const myPendingApproval = pendingApprovals.find(
    (a) => a.phase === currentPhase && a.requiredRole === userRole && a.status === "pending"
  );

  const advancePhase = async (targetPhase: WorkflowPhase) => {
    setLoading(targetPhase);
    try {
      const res = await fetch(`/api/deals/${dealId}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: targetPhase,
          reason: reason || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Phase advanced to ${WORKFLOW_PHASE_LABELS[targetPhase]}`);
        setReason("");
        setShowReason(false);
        onAction();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to advance phase");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  };

  const submitApproval = async (action: "approve" | "reject" | "request_changes") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/deals/${dealId}/workflow/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: currentPhase,
          action,
          notes: reason || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Phase ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes requested"}`);
        setReason("");
        onAction();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit approval");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Actions
          <Badge variant="outline" className="text-xs font-normal">
            {userRole}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending approval for current user */}
        {myPendingApproval && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your approval is required for the <strong>{WORKFLOW_PHASE_LABELS[currentPhase]}</strong> phase.
            </p>
            <Textarea
              placeholder="Notes (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-20"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => submitApproval("approve")}
                disabled={loading !== null}
              >
                {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => submitApproval("request_changes")}
                disabled={loading !== null}
              >
                Request Changes
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => submitApproval("reject")}
                disabled={loading !== null}
              >
                {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Phase transition buttons */}
        {availableTransitions.length > 0 && !myPendingApproval && (
          <div className="space-y-3">
            {/* Missing gates info */}
            {missingGates.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground font-medium">Requirements not yet met:</p>
                {missingGates.map((gate) => (
                  <div key={gate} className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs">{PHASE_GATE_LABELS[gate as PhaseGate] || gate}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show reason input for cancellation/dispute */}
            {showReason && (
              <Textarea
                placeholder="Reason (required for cancellation/dispute)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-20"
              />
            )}

            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((rule) => {
                const isForward = !["cancelled", "disputed"].includes(rule.to) &&
                  rule.to !== currentPhase;
                const isBackward = ["listing", "documentation"].includes(rule.to) &&
                  rule.to !== currentPhase;
                const isDangerous = rule.to === "cancelled" || rule.to === "disputed";
                const hasUnmetGates = rule.gates.length > 0 && missingGates.some((g) => rule.gates.includes(g as PhaseGate));

                return (
                  <Button
                    key={rule.to}
                    size="sm"
                    variant={isDangerous ? "destructive" : isBackward ? "outline" : "default"}
                    disabled={loading !== null || hasUnmetGates}
                    onClick={() => {
                      if (isDangerous && !showReason) {
                        setShowReason(true);
                        return;
                      }
                      advancePhase(rule.to);
                    }}
                  >
                    {loading === rule.to ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : isBackward ? (
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    ) : isDangerous ? (
                      <AlertTriangle className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-1" />
                    )}
                    {WORKFLOW_PHASE_LABELS[rule.to]}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {availableTransitions.length === 0 && !myPendingApproval && (
          <p className="text-sm text-muted-foreground">
            No actions available for your role at this phase.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
