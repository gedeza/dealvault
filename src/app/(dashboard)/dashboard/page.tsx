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
import { Plus, Handshake, FileText, DollarSign, Bell, TrendingUp, Clock } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  PARTY_ROLE_LABELS,
  type DealStatus,
  type PartyRole,
} from "@/types";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Manage your commodity deal rooms
          </p>
        </div>
        <Link href="/deals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal Room
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {deals
                .reduce((sum, d) => sum + d.value, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className={pendingInvites.length > 0 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" /> Pending Invitations
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingInvites.map((deal) => {
              const myParty = deal.parties.find(
                (p) => p.user.id === session?.user?.id && p.status === "invited"
              );
              return (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="border-amber-200 hover:border-amber-300 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardDescription>{deal.dealNumber}</CardDescription>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          Invitation
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{deal.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="capitalize">{deal.commodity}</span>
                        <span>
                          {deal.currency} {deal.value.toLocaleString()}
                        </span>
                      </div>
                      {myParty && (
                        <p className="text-xs text-amber-700 mt-2">
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
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Deal Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  deals.reduce<Record<string, number>>((acc, d) => {
                    acc[d.status] = (acc[d.status] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{DEAL_STATUS_LABELS[status as DealStatus] || status}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${(count / deals.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Commodity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Value by Commodity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  deals.reduce<Record<string, { count: number; value: number }>>((acc, d) => {
                    if (!acc[d.commodity]) acc[d.commodity] = { count: 0, value: 0 };
                    acc[d.commodity].count++;
                    acc[d.commodity].value += d.value;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b.value - a.value)
                  .map(([commodity, { count, value }]) => (
                    <div key={commodity} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize">{commodity}</p>
                        <p className="text-xs text-muted-foreground">{count} deals</p>
                      </div>
                      <p className="text-sm font-semibold">${value.toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Deal Rooms</h2>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No deal rooms yet. Create your first one to get started.
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 6).map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="hover:border-emerald-200 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>{deal.dealNumber}</CardDescription>
                      <Badge
                        variant="secondary"
                        className={DEAL_STATUS_COLORS[deal.status]}
                      >
                        {DEAL_STATUS_LABELS[deal.status]}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{deal.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="capitalize">{deal.commodity}</span>
                      <span>
                        {deal.currency} {deal.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{deal.parties.length} parties</span>
                      <span>{deal._count.documents} docs</span>
                      <span>{deal._count.messages} messages</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {activity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Recent Activity
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {activity.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex gap-3 border-b pb-3 last:border-0">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Link href={`/deals/${event.deal.id}`} className="text-emerald-600 hover:underline">
                          {event.deal.dealNumber}
                        </Link>
                        <span>by {event.user.name}</span>
                        <span title={new Date(event.createdAt).toLocaleString()}>{timeAgo(event.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
