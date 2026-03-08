"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Gem,
  FileStack,
  Wallet,
  BellRing,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Users,
  MessageSquare,
  FileText,
  Clock,
  CirclePlus,
  ArrowRightLeft,
  UserPlus,
  Coins,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  CircleDot,
} from "lucide-react";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  PARTY_ROLE_LABELS,
  type DealStatus,
  type PartyRole,
} from "@/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const COMMODITY_THEME: Record<string, { icon: string; gradient: string; accent: string; bg: string }> = {
  gold: {
    icon: "Au",
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  diamonds: {
    icon: "Ct",
    gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
    accent: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  platinum: {
    icon: "Pt",
    gradient: "from-slate-500/10 via-zinc-500/5 to-transparent",
    accent: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
  },
  tanzanite: {
    icon: "Tz",
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
};

const STATUS_BAR_COLORS: Record<string, string> = {
  draft: "bg-zinc-400",
  documents_pending: "bg-amber-500",
  under_review: "bg-blue-500",
  verified: "bg-emerald-500",
  in_progress: "bg-indigo-500",
  settled: "bg-teal-500",
  closed: "bg-slate-500",
  cancelled: "bg-red-400",
};

function getEventIcon(eventType: string, description: string) {
  if (description.includes("created"))
    return <CirclePlus className="h-4 w-4 text-emerald-500" />;
  if (description.includes("status changed"))
    return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
  if (description.includes("invited"))
    return <UserPlus className="h-4 w-4 text-violet-500" />;
  if (description.includes("accepted"))
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (description.includes("Commission") || description.includes("commission"))
    return <Coins className="h-4 w-4 text-amber-500" />;
  if (description.includes("document") || description.includes("uploaded"))
    return <FileText className="h-4 w-4 text-sky-500" />;
  if (description.includes("message"))
    return <MessageSquare className="h-4 w-4 text-indigo-500" />;
  return <CircleDot className="h-4 w-4 text-muted-foreground" />;
}

interface Deal {
  id: string;
  dealNumber: string;
  title: string;
  commodity: string;
  value: number;
  currency: string;
  status: DealStatus;
  createdAt: string;
  _count: { documents: number; messages: number };
  parties: { id: string; role: PartyRole; status: string; user: { id: string; name: string } }[];
}

interface Activity {
  id: string;
  eventType: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string };
  deal: { id: string; dealNumber: string; title: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/deals?limit=50").then((res) => res.json()),
      fetch("/api/activity").then((res) => res.json()),
    ])
      .then(([dealsData, activityData]) => {
        setDeals(dealsData.deals || dealsData);
        setActivity(Array.isArray(activityData) ? activityData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeDeals = deals.filter(
    (d) => !["closed", "cancelled"].includes(d.status)
  );

  const pendingInvites = deals.filter((d) =>
    d.parties.some(
      (p) => p.user.id === session?.user?.id && p.status === "invited"
    )
  );

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const statCards = [
    {
      label: "Total Deals",
      value: deals.length,
      icon: Gem,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      description: `${deals.filter(d => d.status === "closed" || d.status === "settled").length} completed`,
    },
    {
      label: "Active Deals",
      value: activeDeals.length,
      icon: FileStack,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "In progress",
    },
    {
      label: "Portfolio Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: Wallet,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      description: `${deals.length > 0 ? `~$${Math.round(totalValue / deals.length).toLocaleString()} avg` : "No deals yet"}`,
    },
    {
      label: "Pending Invites",
      value: pendingInvites.length,
      icon: BellRing,
      iconBg: pendingInvites.length > 0 ? "bg-amber-500/10" : "bg-muted",
      iconColor: pendingInvites.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      description: pendingInvites.length > 0 ? "Action required" : "All clear",
      highlight: pendingInvites.length > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {getGreeting()}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your deal rooms today.
          </p>
        </div>
        <Link href="/deals/new">
          <Button className="gap-2 shadow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Deal Room
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-tour="dashboard-stats">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`relative overflow-hidden transition-all hover:shadow-md ${
              stat.highlight ? "border-amber-300 dark:border-amber-700" : ""
            }`}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold tracking-tight">{loading ? <Skeleton className="h-7 w-16 sm:h-8 sm:w-20" /> : stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {loading ? <Skeleton className="h-3 w-16" /> : stat.description}
                  </p>
                </div>
                <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${stat.iconBg}`}>
                  <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
            {stat.highlight && (
              <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
            )}
          </Card>
        ))}
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <BellRing className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold">Pending Invitations</h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {pendingInvites.length}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingInvites.map((deal) => {
              const myParty = deal.parties.find(
                (p) => p.user.id === session?.user?.id && p.status === "invited"
              );
              const theme = COMMODITY_THEME[deal.commodity] || COMMODITY_THEME.gold;
              return (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-md cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardDescription>{deal.dealNumber}</CardDescription>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Invitation
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{deal.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium capitalize ${theme.accent}`}>{deal.commodity}</span>
                        <span className="font-semibold">
                          {deal.currency} {deal.value.toLocaleString()}
                        </span>
                      </div>
                      {myParty && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          Invited as {PARTY_ROLE_LABELS[myParty.role]}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics */}
      {!loading && deals.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Status Distribution */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Deal Pipeline</CardTitle>
                  <CardDescription className="text-xs">Status distribution across all deals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  deals.reduce<Record<string, number>>((acc, d) => {
                    acc[d.status] = (acc[d.status] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR_COLORS[status] || "bg-muted"}`} />
                          <span className="font-medium">{DEAL_STATUS_LABELS[status as DealStatus] || status}</span>
                        </div>
                        <span className="text-muted-foreground tabular-nums">
                          {count} <span className="text-xs">({Math.round((count / deals.length) * 100)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR_COLORS[status] || "bg-primary"}`}
                          style={{ width: `${(count / deals.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Commodity Breakdown */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <PieChart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Portfolio Breakdown</CardTitle>
                  <CardDescription className="text-xs">Value distribution by commodity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  deals.reduce<Record<string, { count: number; value: number }>>((acc, d) => {
                    if (!acc[d.commodity]) acc[d.commodity] = { count: 0, value: 0 };
                    acc[d.commodity].count++;
                    acc[d.commodity].value += d.value;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b.value - a.value)
                  .map(([commodity, { count, value }]) => {
                    const theme = COMMODITY_THEME[commodity] || COMMODITY_THEME.gold;
                    const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                    return (
                      <div key={commodity} className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${theme.bg} shrink-0`}>
                          <span className={`text-sm font-bold ${theme.accent}`}>{theme.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium capitalize">{commodity}</p>
                            <p className="text-sm font-bold tabular-nums">${value.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted/50 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${theme.bg.replace("/10", "/60")}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                              {count} deal{count !== 1 ? "s" : ""} / {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Deal Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Recent Deal Rooms</h2>
          </div>
          {deals.length > 6 && (
            <Link href="/deals">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Gem className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">No deal rooms yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first deal room to start managing commodity transactions with full audit trails.
              </p>
              <Link href="/deals/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Deal Room
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 6).map((deal) => {
              const theme = COMMODITY_THEME[deal.commodity] || COMMODITY_THEME.gold;
              return (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className={`group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} pointer-events-none`} />
                    <CardHeader className="pb-2 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 items-center justify-center rounded ${theme.bg}`}>
                            <span className={`text-[10px] font-bold ${theme.accent}`}>{theme.icon}</span>
                          </div>
                          <CardDescription className="font-mono text-xs">{deal.dealNumber}</CardDescription>
                        </div>
                        <Badge
                          variant="secondary"
                          className={DEAL_STATUS_COLORS[deal.status]}
                        >
                          {DEAL_STATUS_LABELS[deal.status]}
                        </Badge>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors mt-1">
                        {deal.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium capitalize ${theme.accent}`}>{deal.commodity}</span>
                        <span className="font-semibold tabular-nums">
                          {deal.currency} {deal.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {deal.parties.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {deal._count.documents}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {deal._count.messages}
                        </span>
                        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                          Open <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {activity.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-1">
                  {activity.slice(0, 10).map((event, index) => (
                    <div
                      key={event.id}
                      className={`flex gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50 relative ${
                        index === 0 ? "bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex-shrink-0 relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm">
                        {getEventIcon(event.eventType, event.description)}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm leading-snug">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <Link
                            href={`/deals/${event.deal.id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {event.deal.dealNumber}
                          </Link>
                          <span className="text-border">|</span>
                          <span>{event.user.name}</span>
                          <span className="text-border">|</span>
                          <span title={new Date(event.createdAt).toLocaleString()}>
                            {timeAgo(event.createdAt)}
                          </span>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="self-start text-[10px] bg-primary/10 text-primary shrink-0">
                          Latest
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions (when no deals) */}
      {!loading && deals.length > 0 && deals.length < 5 && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Grow your portfolio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have {deals.length} deal{deals.length !== 1 ? "s" : ""} in your portfolio. Create more deal rooms to track all your commodity transactions in one place.
                </p>
              </div>
              <Link href="/deals/new">
                <Button variant="outline" size="sm" className="gap-1 shrink-0 border-primary/30 text-primary hover:bg-primary/5">
                  <Plus className="h-3.5 w-3.5" /> New Deal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
