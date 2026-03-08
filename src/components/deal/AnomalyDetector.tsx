"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, ChevronDown, ChevronUp, ScanSearch } from "lucide-react";

interface Anomaly {
  type: string;
  severity: "info" | "warning" | "critical";
  description: string;
}

interface AnomalyResult {
  anomalies: Anomaly[];
  overallRisk: "normal" | "elevated" | "suspicious";
}

const severityColors = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const riskColors = {
  normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  elevated: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspicious: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function AnomalyDetector({ dealId }: { dealId: string }) {
  const [result, setResult] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/anomalies`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setExpanded(true);
      } else {
        setError(data.error || "Scan failed");
      }
    } catch {
      setError("Failed to reach anomaly detection service");
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <Button onClick={scan} size="sm" variant="outline" className="gap-2">
        <ScanSearch className="h-4 w-4" />
        Anomaly Scan
      </Button>
    );
  }

  if (loading) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Scanning...
      </Button>
    );
  }

  if (error) {
    return (
      <Button onClick={scan} size="sm" variant="outline" className="gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        {error} — Retry
      </Button>
    );
  }

  if (!result) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <ScanSearch className="h-4 w-4" />
          Anomaly Detection
          <Badge className={riskColors[result.overallRisk]}>
            {result.overallRisk.toUpperCase()}
          </Badge>
          {result.anomalies.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({result.anomalies.length} finding{result.anomalies.length !== 1 ? "s" : ""})
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {result.anomalies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No anomalies detected.</p>
          ) : (
            <div className="space-y-2">
              {result.anomalies.map((anomaly, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge className={`${severityColors[anomaly.severity]} shrink-0 mt-0.5`}>
                    {anomaly.severity}
                  </Badge>
                  <div>
                    <span className="font-medium">{anomaly.type}:</span>{" "}
                    {anomaly.description}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button onClick={scan} size="sm" variant="outline" className="mt-3">
            Re-scan
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
