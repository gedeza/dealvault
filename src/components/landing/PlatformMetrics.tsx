"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalDeals: number;
  totalUsers: number;
  totalDealValue: number;
  totalCompanies: number;
}

function formatValue(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B+`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K+`;
  if (value > 0) return `$${value.toLocaleString()}`;
  return "$0";
}

export function PlatformMetrics() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const metrics = [
    {
      value: stats ? formatValue(stats.totalDealValue) : "—",
      label: "Deal value tracked",
    },
    {
      value: stats ? `${stats.totalDeals}` : "—",
      label: "Deals managed",
    },
    {
      value: "6-Phase",
      label: "Escrow workflow",
    },
    {
      value: "5-Point",
      label: "Custody chain",
    },
  ];

  return (
    <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 md:grid-cols-4">
      {metrics.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
