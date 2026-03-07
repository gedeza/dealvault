"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Link2,
  Shield,
  Check,
  AlertTriangle,
  Clock,
  MapPin,
  Weight,
  Camera,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CheckpointSubmitForm } from "./CheckpointSubmitForm";
import { cn } from "@/lib/utils";
import type { WorkflowRole } from "@/types/workflow";

interface Confirmation {
  id: string;
  partyRole: string;
  side: string;
  status: string;
  disputeReason: string | null;
  confirmedAt: string;
  confirmedByUser: { id: string; name: string };
}

interface Checkpoint {
  id: string;
  sequence: number;
  checkpointType: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  notes: string | null;
  sealIntact: boolean | null;
  weight: number | null;
  weightUnit: string | null;
  photoPath: string | null;
  photoHash: string | null;
  submittedAt: string | null;
  submittedByUser: { id: string; name: string } | null;
  isMandatory: boolean;
  isComplete: boolean;
  completedAt: string | null;
  confirmations: Confirmation[];
}

interface CustodyLogData {
  id: string;
  sealId: string;
  status: string;
  custodianName: string | null;
  custodianType: string | null;
  custodianContact: string | null;
  checkpoints: Checkpoint[];
}

interface CustodyTrackerProps {
  dealId: string;
  custody: CustodyLogData;
  userRole: WorkflowRole | null;
  currentUserId: string;
  onUpdate: () => void;
}

export function CustodyTracker({
  dealId,
  custody,
  userRole,
  currentUserId,
  onUpdate,
}: CustodyTrackerProps) {
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const confirmCheckpoint = async (checkpointId: string, status: "confirmed" | "disputed") => {
    if (status === "disputed" && !disputeReason) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setConfirmingId(checkpointId);
    try {
      const res = await fetch(
        `/api/deals/${dealId}/custody/checkpoints/${checkpointId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            disputeReason: status === "disputed" ? disputeReason : undefined,
          }),
        }
      );

      if (res.ok) {
        toast.success(status === "confirmed" ? "Checkpoint confirmed" : "Dispute raised");
        setDisputeReason("");
        onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setConfirmingId(null);
    }
  };

  const completedCount = custody.checkpoints.filter((cp) => cp.isComplete).length;
  const mandatoryCount = custody.checkpoints.filter((cp) => cp.isMandatory).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Chain of Custody
          <Badge variant="outline" className="ml-auto">
            Seal: {custody.sealId}
          </Badge>
        </CardTitle>
        {custody.custodianName && (
          <p className="text-xs text-muted-foreground">
            Custodian: {custody.custodianName}
            {custody.custodianType ? ` (${custody.custodianType})` : ""}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {completedCount} of {mandatoryCount} mandatory checkpoints verified
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {custody.checkpoints.map((cp) => {
          const isExpanded = expandedCheckpoint === cp.id;
          const hasEvidence = !!cp.submittedAt;
          const hasDispute = cp.confirmations.some((c) => c.status === "disputed");
          const userAlreadyConfirmed = cp.confirmations.some(
            (c) => c.confirmedByUser.id === currentUserId
          );
          const isSubmitter = cp.submittedByUser?.id === currentUserId;
          const canConfirm = hasEvidence && !cp.isComplete && !userAlreadyConfirmed && !isSubmitter && userRole;

          return (
            <div
              key={cp.id}
              className={cn(
                "border rounded-lg p-3 transition-all",
                cp.isComplete && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10",
                hasDispute && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10",
                !cp.isComplete && !hasDispute && "border-border"
              )}
            >
              {/* Checkpoint header */}
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => setExpandedCheckpoint(isExpanded ? null : cp.id)}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                    cp.isComplete && "bg-emerald-500 text-white",
                    hasDispute && "bg-red-500 text-white",
                    !cp.isComplete && !hasDispute && hasEvidence && "bg-blue-500 text-white",
                    !cp.isComplete && !hasDispute && !hasEvidence && "bg-muted text-muted-foreground"
                  )}
                >
                  {cp.isComplete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : hasDispute ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    cp.sequence
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{cp.label}</span>
                    {!cp.isMandatory && (
                      <Badge variant="outline" className="text-xs">optional</Badge>
                    )}
                  </div>
                  {hasEvidence && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {cp.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cp.locationName}
                        </span>
                      )}
                      {cp.weight && (
                        <span className="flex items-center gap-1">
                          <Weight className="h-3 w-3" /> {cp.weight}{cp.weightUnit || "g"}
                        </span>
                      )}
                      {cp.sealIntact !== null && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Seal: {cp.sealIntact ? "Intact" : "Broken"}
                        </span>
                      )}
                      {cp.photoPath && (
                        <span className="flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Photo
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Confirmation badges */}
                <div className="flex gap-1 flex-shrink-0">
                  {cp.confirmations.map((conf) => (
                    <Badge
                      key={conf.id}
                      variant="outline"
                      className={cn(
                        "text-xs",
                        conf.status === "confirmed" && "border-emerald-300 text-emerald-700",
                        conf.status === "disputed" && "border-red-300 text-red-700"
                      )}
                    >
                      {conf.side === "sell" ? "S" : "B"}
                    </Badge>
                  ))}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {/* Evidence details */}
                  {hasEvidence ? (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        Submitted by {cp.submittedByUser?.name} at{" "}
                        {new Date(cp.submittedAt!).toLocaleString()}
                      </p>
                      {cp.notes && <p>{cp.notes}</p>}
                      {cp.sealIntact === false && (
                        <p className="text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Seal reported as broken
                        </p>
                      )}
                    </div>
                  ) : (
                    // Evidence submission form
                    <CheckpointSubmitForm
                      dealId={dealId}
                      checkpointId={cp.id}
                      onSubmit={onUpdate}
                    />
                  )}

                  {/* Confirmations list */}
                  {cp.confirmations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Confirmations:</p>
                      {cp.confirmations.map((conf) => (
                        <div key={conf.id} className="flex items-center gap-2 text-xs">
                          <Badge
                            variant="outline"
                            className={cn(
                              conf.status === "confirmed" && "border-emerald-300",
                              conf.status === "disputed" && "border-red-300"
                            )}
                          >
                            {conf.status}
                          </Badge>
                          <span>{conf.confirmedByUser.name}</span>
                          <span className="text-muted-foreground">
                            ({conf.partyRole}, {conf.side} side)
                          </span>
                          <span className="text-muted-foreground ml-auto">
                            {new Date(conf.confirmedAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {cp.confirmations.some((c) => c.status === "disputed") && (
                        <div className="text-xs text-red-600 mt-1">
                          {cp.confirmations
                            .filter((c) => c.status === "disputed")
                            .map((c) => (
                              <p key={c.id}>Dispute: {c.disputeReason}</p>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm / Dispute buttons */}
                  {canConfirm && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        disabled={confirmingId === cp.id}
                        onClick={() => confirmCheckpoint(cp.id, "confirmed")}
                      >
                        {confirmingId === cp.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={confirmingId === cp.id}
                        onClick={() => {
                          const reason = prompt("Reason for dispute:");
                          if (reason) {
                            setDisputeReason(reason);
                            confirmCheckpoint(cp.id, "disputed");
                          }
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Dispute
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
