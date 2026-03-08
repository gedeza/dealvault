"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Check, X, AlertTriangle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface IntegrityChain {
  sealId: string;
  custodian: { name: string | null; type: string | null; contact: string | null };
  status: string;
  checkpoints: Array<{
    sequence: number;
    type: string;
    label: string;
    isMandatory: boolean;
    isComplete: boolean;
    submittedAt: string | null;
    submittedBy: string | null;
    completedAt: string | null;
    location: { name: string | null; latitude: number | null; longitude: number | null };
    sealIntact: boolean | null;
    weight: number | null;
    weightUnit: string | null;
    photoHash: string | null;
    videoHash: string | null;
    confirmations: Array<{
      confirmedBy: string | null;
      role: string;
      side: string;
      status: string;
      disputeReason: string | null;
      confirmedAt: string;
    }>;
  }>;
}

export function IntegrityChainViewer({ dealId }: { dealId: string }) {
  const [chain, setChain] = useState<IntegrityChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadChain = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/custody/integrity`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to load integrity chain");
        return;
      }
      const data = await res.json();
      setChain(data);
      setExpanded(true);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const downloadChain = () => {
    if (!chain) return;
    const blob = new Blob([JSON.stringify(chain, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `integrity-chain-${dealId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={loadChain} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
        View Integrity Chain
      </Button>
    );
  }

  if (!chain) return null;

  const allComplete = chain.checkpoints.filter(c => c.isMandatory).every(c => c.isComplete);

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-sm">Integrity Chain</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            allComplete
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {allComplete ? "Verified" : "In Progress"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={downloadChain}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-1 text-xs text-muted-foreground">
        <p>Seal ID: <span className="font-mono text-foreground">{chain.sealId}</span></p>
        {chain.custodian.name && <p>Custodian: {chain.custodian.name} ({chain.custodian.type})</p>}
        <p>Status: <span className="capitalize">{chain.status}</span></p>
      </div>

      <div className="space-y-3">
        {chain.checkpoints.map((cp) => (
          <div key={cp.sequence} className="rounded border p-3 text-sm">
            <div className="flex items-center gap-2">
              {cp.isComplete ? (
                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : cp.submittedAt ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              )}
              <span className="font-medium">{cp.sequence}. {cp.label}</span>
              {cp.isMandatory && <span className="text-xs text-red-500">Required</span>}
            </div>

            {cp.submittedAt && (
              <div className="mt-2 ml-6 grid gap-1 text-xs text-muted-foreground">
                {cp.submittedBy && <p>Submitted by: {cp.submittedBy}</p>}
                {cp.location.name && <p>Location: {cp.location.name}</p>}
                {cp.location.latitude && <p>GPS: {cp.location.latitude}, {cp.location.longitude}</p>}
                {cp.sealIntact !== null && (
                  <p>Seal: {cp.sealIntact ? "Intact" : "Broken/Tampered"}</p>
                )}
                {cp.weight !== null && <p>Weight: {cp.weight} {cp.weightUnit}</p>}
                {cp.photoHash && <p>Photo hash: <span className="font-mono">{cp.photoHash.slice(0, 16)}...</span></p>}
                {cp.videoHash && <p>Video hash: <span className="font-mono">{cp.videoHash.slice(0, 16)}...</span></p>}

                {cp.confirmations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {cp.confirmations.map((conf, i) => (
                      <p key={i} className={conf.status === "confirmed" ? "text-emerald-600" : "text-red-500"}>
                        {conf.confirmedBy} ({conf.side} side) — {conf.status}
                        {conf.disputeReason && `: ${conf.disputeReason}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
