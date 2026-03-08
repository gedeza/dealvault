"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendation: string;
}

const levelColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function DealRiskBadge({ dealId }: { dealId: string }) {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assess = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/risk`);
      const data = await res.json();
      if (res.ok) {
        setRisk(data);
        setExpanded(true);
      } else {
        setError(data.error || "Assessment failed");
      }
    } catch {
      setError("Failed to reach risk assessment service");
    } finally {
      setLoading(false);
    }
  };

  if (!risk && !loading) {
    return (
      <Button onClick={assess} size="sm" variant="outline" className="gap-2" disabled={loading}>
        <ShieldAlert className="h-4 w-4" />
        Risk Score
      </Button>
    );
  }

  if (loading) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing...
      </Button>
    );
  }

  if (error) {
    return (
      <Button onClick={assess} size="sm" variant="outline" className="gap-2 text-destructive">
        <ShieldAlert className="h-4 w-4" />
        {error} — Retry
      </Button>
    );
  }

  if (!risk) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Risk Assessment
          <Badge className={levelColors[risk.level]}>
            {risk.level.toUpperCase()} — {risk.score}/100
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Risk Factors</p>
              <ul className="text-sm space-y-1">
                {risk.factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
              <p className="text-sm">{risk.recommendation}</p>
            </div>
            <Button onClick={assess} size="sm" variant="outline" className="mt-2">
              Re-assess
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
