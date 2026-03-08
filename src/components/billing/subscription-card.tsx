"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowUpRight, Settings, Gem } from "lucide-react";
import { toast } from "sonner";

interface BillingData {
  tier: string;
  limits: {
    maxActiveDeals: number;
    maxSeats: number;
    storageGB: number;
    dealValueCap: number | null;
    escrowWorkflow: boolean;
    chainOfCustody: boolean;
    complianceReporting: boolean;
    advancedReporting: boolean;
    webhooks: boolean;
    apiAccess: boolean;
  };
}

const TIER_COLORS: Record<string, string> = {
  prospect: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  reef: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  sovereign: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  vault: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
};

const TIER_LABELS: Record<string, string> = {
  prospect: "Prospect",
  reef: "Reef",
  sovereign: "Sovereign",
  vault: "Vault",
};

function formatCap(val: number | null): string {
  if (val === null) return "Unlimited";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${(val / 1_000).toFixed(0)}K`;
}

export function SubscriptionCard() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then(setBilling)
      .catch(() => {});
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Unable to start checkout");
      }
    } catch {
      toast.error("Failed to connect to billing");
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManage() {
    setManaging(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Unable to open billing portal");
      }
    } catch {
      toast.error("Failed to connect to billing");
    } finally {
      setManaging(false);
    }
  }

  if (!billing) return null;

  const tier = billing.tier;
  const limits = billing.limits;
  const isLowestTier = tier === "prospect";
  const isHighestTier = tier === "vault";

  return (
    <Card id="billing">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Subscription & Billing
        </CardTitle>
        <CardDescription>Manage your plan and usage limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Gem className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current Plan</span>
                <Badge className={TIER_COLORS[tier] || TIER_COLORS.prospect}>
                  {TIER_LABELS[tier] || tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isHighestTier
                  ? "Enterprise plan — all features unlocked"
                  : isLowestTier
                  ? "Entry plan — upgrade to unlock escrow workflow and more"
                  : `Active subscription`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isHighestTier && (
              <Button size="sm" onClick={handleUpgrade} disabled={upgrading} className="gap-1">
                {upgrading ? "Loading..." : "Upgrade"}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            )}
            {!isLowestTier && (
              <Button size="sm" variant="outline" onClick={handleManage} disabled={managing} className="gap-1">
                <Settings className="h-3 w-3" />
                {managing ? "Loading..." : "Manage"}
              </Button>
            )}
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LimitItem label="Active Deals" value={String(limits.maxActiveDeals >= 999 ? "Unlimited" : limits.maxActiveDeals)} />
          <LimitItem label="Users / Seats" value={String(limits.maxSeats >= 999 ? "Unlimited" : limits.maxSeats)} />
          <LimitItem label="Storage" value={`${limits.storageGB >= 1000 ? "1 TB+" : limits.storageGB + " GB"}`} />
          <LimitItem label="Deal Value Cap" value={formatCap(limits.dealValueCap)} />
        </div>

        {/* Feature Access */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <FeatureItem label="Escrow Workflow" enabled={limits.escrowWorkflow} />
          <FeatureItem label="Chain of Custody" enabled={limits.chainOfCustody} />
          <FeatureItem label="Compliance Reports" enabled={limits.complianceReporting} />
          <FeatureItem label="Advanced Reports" enabled={limits.advancedReporting} />
          <FeatureItem label="Webhooks" enabled={limits.webhooks} />
          <FeatureItem label="API Access" enabled={limits.apiAccess} />
        </div>
      </CardContent>
    </Card>
  );
}

function LimitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2.5 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function FeatureItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
      <span className={enabled ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
