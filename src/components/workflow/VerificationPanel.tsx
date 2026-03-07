"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  VERIFICATION_RESULTS,
  VERIFICATION_RESULT_LABELS,
  type WorkflowRole,
} from "@/types/workflow";

interface VerificationData {
  id: string;
  location: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  inspectorName: string | null;
  inspectorCompany: string | null;
  result: string | null;
  findings: string | null;
  assayDocument: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface VerificationPanelProps {
  dealId: string;
  verification: VerificationData | null;
  userRole: WorkflowRole | null;
  onUpdate: () => void;
}

export function VerificationPanel({
  dealId,
  verification,
  userRole,
  onUpdate,
}: VerificationPanelProps) {
  const isIntermediary = userRole === "intermediary";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    location: verification?.location || "",
    inspectorName: verification?.inspectorName || "",
    inspectorCompany: verification?.inspectorCompany || "",
    result: verification?.result || "",
    findings: verification?.findings || "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (form.location) payload.location = form.location;
      if (form.inspectorName) payload.inspectorName = form.inspectorName;
      if (form.inspectorCompany) payload.inspectorCompany = form.inspectorCompany;
      if (form.result) payload.result = form.result;
      if (form.findings) payload.findings = form.findings;

      const res = await fetch(`/api/deals/${dealId}/workflow/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Verification record updated");
        onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resultColors: Record<string, string> = {
    passed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    conditional: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Testing & Verification
          {verification?.result && (
            <Badge className={resultColors[verification.result] || ""}>
              {VERIFICATION_RESULT_LABELS[verification.result as keyof typeof VERIFICATION_RESULT_LABELS] || verification.result}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isIntermediary ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Location / Refinery</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Rand Refinery, Germiston"
                />
              </div>
              <div>
                <Label className="text-xs">Result</Label>
                <Select
                  value={form.result}
                  onValueChange={(v) => setForm({ ...form, result: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {VERIFICATION_RESULT_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Inspector Name</Label>
                <Input
                  value={form.inspectorName}
                  onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Inspector Company</Label>
                <Input
                  value={form.inspectorCompany}
                  onChange={(e) => setForm({ ...form, inspectorCompany: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Findings / Notes</Label>
              <Textarea
                value={form.findings}
                onChange={(e) => setForm({ ...form, findings: e.target.value })}
                placeholder="Test findings, observations, purity results..."
                className="h-20"
              />
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {verification ? "Update Record" : "Create Record"}
            </Button>
          </div>
        ) : (
          // Read-only view for non-intermediary roles
          <div className="space-y-2 text-sm">
            {!verification ? (
              <p className="text-muted-foreground">No verification record yet. The intermediary will record test results.</p>
            ) : (
              <>
                {verification.location && (
                  <p><span className="text-muted-foreground">Location:</span> {verification.location}</p>
                )}
                {verification.inspectorName && (
                  <p><span className="text-muted-foreground">Inspector:</span> {verification.inspectorName}{verification.inspectorCompany ? ` (${verification.inspectorCompany})` : ""}</p>
                )}
                {verification.findings && (
                  <p><span className="text-muted-foreground">Findings:</span> {verification.findings}</p>
                )}
                {verification.assayDocument && (
                  <p><span className="text-muted-foreground">Assay Report:</span> {verification.assayDocument.name}</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
