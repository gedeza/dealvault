"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Handshake,
  DollarSign,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  type DealStatus,
} from "@/types";

interface AdminStats {
  totalUsers: number;
  totalDeals: number;
  totalDealValue: number;
  dealsByStatus: { status: string; count: number }[];
  recentDeals: {
    id: string;
    dealNumber: string;
    title: string;
    commodity: string;
    value: number;
    currency: string;
    status: string;
    createdAt: string;
    creator: { id: string; name: string };
  }[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  _count: { dealParties: number; createdDeals: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  const fetchUsers = useCallback(
    async (page = 1, searchQuery = "") => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } finally {
        setLoadingUsers(false);
      }
    },
    []
  );

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) return;

    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoadingStats(false));

    fetchUsers();
  }, [sessionStatus, isAdmin, fetchUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    const timeout = setTimeout(() => {
      fetchUsers(1, search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, isAdmin, fetchUsers]);

  if (sessionStatus === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access the admin panel.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  async function handleRoleToggle(user: AdminUser) {
    if (user.id === session?.user?.id) {
      toast.error("Cannot change your own role");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    setUpdatingRole(user.id);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success(`${user.name} is now ${newRole === "admin" ? "an admin" : "a user"}`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  }

  const maxBarCount = stats
    ? Math.max(...stats.dealsByStatus.map((d) => d.count), 1)
    : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Platform-wide statistics and user management
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deals
                </CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats?.totalDeals ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deal Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    ${(stats?.totalDealValue ?? 0).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deals by Status Chart */}
          {stats && stats.dealsByStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Deals by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.dealsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">
                        <Badge
                          variant="secondary"
                          className={
                            DEAL_STATUS_COLORS[item.status as DealStatus] || ""
                          }
                        >
                          {DEAL_STATUS_LABELS[item.status as DealStatus] ||
                            item.status}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all"
                            style={{
                              width: `${(item.count / maxBarCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Deals Table */}
          {stats && stats.recentDeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-mono text-sm">
                          {deal.dealNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {deal.title}
                        </TableCell>
                        <TableCell className="capitalize">
                          {deal.commodity}
                        </TableCell>
                        <TableCell>
                          {deal.currency} {deal.value.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              DEAL_STATUS_COLORS[deal.status as DealStatus] ||
                              ""
                            }
                          >
                            {DEAL_STATUS_LABELS[deal.status as DealStatus] ||
                              deal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{deal.creator.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {pagination.total} user{pagination.total !== 1 ? "s" : ""}
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                            className={
                              user.role === "admin"
                                ? "bg-emerald-100 text-emerald-800"
                                : ""
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              user.twoFactorEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <span className="text-green-600 text-sm">Yes</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user._count.createdDeals + user._count.dealParties}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              user.id === session?.user?.id ||
                              updatingRole === user.id
                            }
                            onClick={() => handleRoleToggle(user)}
                          >
                            {updatingRole === user.id
                              ? "..."
                              : user.role === "admin"
                                ? "Revoke Admin"
                                : "Make Admin"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1, search)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1, search)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
