"use client";

import { useEffect, useState } from "react";

export interface TierData {
  tier: string;
  limits: {
    maxActiveDeals: number;
    maxSeats: number;
    maxPartiesPerDeal: number;
    storageGB: number;
    dealValueCap: number | null;
    escrowWorkflow: boolean;
    chainOfCustody: boolean;
    apiAccess: boolean;
    apiDailyLimit: number | null;
    complianceReporting: boolean;
    advancedReporting: boolean;
    webhooks: boolean;
  };
}

export function useTier() {
  const [data, setData] = useState<TierData | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return data;
}
