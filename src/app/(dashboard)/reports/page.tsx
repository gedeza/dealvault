"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Gem, Wallet } from "lucide-react";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useTier } from "@/hooks/useTier";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  AreaChart,
  Area,
} from "recharts";
import { DEAL_STATUS_LABELS, type DealStatus } from "@/types";

const COMMODITY_COLORS: Record<string, string> = {
  gold: "#F59E0B",
  diamonds: "#06B6D4",
  platinum: "#6366F1",
  tanzanite: "#8B5CF6",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#71717A",
  documents_pending: "#F59E0B",
  under_review: "#3B82F6",
  verified: "#10B981",
  in_progress: "#6366F1",
  settled: "#14B8A6",
  closed: "#64748B",
  cancelled: "#EF4444",
};

interface ReportData {
  summary: {
    totalDeals: number;
    totalValue: number;
    avgDealSize: number;
    activeDeals: number;
    totalCommissions: number;
  };
  monthlyTrend: { month: string; volume: number; value: number; commissions: number }[];
  commodityDistribution: { commodity: string; count: number; value: number }[];
  statusDistribution: { status: string; count: number }[];
  topParties: { name: string; dealCount: number; roles: string[] }[];
  sizeDistribution: { label: string; count: number }[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes("Value") || entry.name.includes("Commission")
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium capitalize">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        {data.payload.count} deals &middot; {formatCurrency(data.payload.value)}
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ReportsPage() {
  const tierData = useTier();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("12m");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  const cumulativeCommissions = data?.monthlyTrend?.reduce<{ month: string; total: number }[]>((acc, item) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].total : 0;
    acc.push({ month: formatMonth(item.month), total: prev + item.commissions });
    return acc;
  }, []) || [];

  const statCards = data ? [
    { label: "Total Deals", value: data.summary.totalDeals, icon: Gem, color: "text-primary" },
    { label: "Total Value", value: formatCurrency(data.summary.totalValue), icon: Wallet, color: "text-amber-500" },
    { label: "Avg Deal Size", value: formatCurrency(data.summary.avgDealSize), icon: TrendingUp, color: "text-blue-500" },
    { label: "Active Deals", value: data.summary.activeDeals, icon: BarChart3, color: "text-emerald-500" },
  ] : [];

  if (tierData && !tierData.limits.advancedReporting) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Interactive dashboards and deal insights</p>
        </div>
        <UpgradePrompt
          feature="Advanced Reporting"
          requiredTier="Reef"
          description="Interactive charts, deal pipeline visualization, commodity breakdowns, and commission tracking are available on the Reef tier and above."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Track performance across your deal portfolio</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className={i === 0 ? "md:col-span-2" : ""}>
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : data && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Deal Volume & Value Trend (Full Width) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Deal Volume & Value Trend</CardTitle>
              <CardDescription>Monthly deal count and total value</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data.monthlyTrend.map((d) => ({ ...d, month: formatMonth(d.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="volume" name="Deals" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    name="Total Value"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Commodity Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commodity Distribution</CardTitle>
              <CardDescription>Portfolio allocation by commodity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.commodityDistribution}
                    dataKey="value"
                    nameKey="commodity"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.commodityDistribution.map((entry) => (
                      <Cell
                        key={entry.commodity}
                        fill={COMMODITY_COLORS[entry.commodity] || "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {data.commodityDistribution.map((c) => (
                  <div key={c.commodity} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COMMODITY_COLORS[c.commodity] || "#94A3B8" }}
                    />
                    <span className="capitalize">{c.commodity}</span>
                    <span className="text-muted-foreground">({c.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deal Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Pipeline</CardTitle>
              <CardDescription>Deals by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.statusDistribution.sort((a, b) => b.count - a.count)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(s) => DEAL_STATUS_LABELS[s as DealStatus] || s}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-medium">{DEAL_STATUS_LABELS[d.status as DealStatus] || d.status}</p>
                          <p className="text-xs text-muted-foreground">{d.count} deals</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Commission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cumulative Commissions</CardTitle>
              <CardDescription>Running total over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cumulativeCommissions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Commission Total"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Deal Size Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Size Distribution</CardTitle>
              <CardDescription>Number of deals by value range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.sizeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-medium">{payload[0].payload.label}</p>
                          <p className="text-xs text-muted-foreground">{payload[0].value} deals</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
