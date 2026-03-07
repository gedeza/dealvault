"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  DEAL_STATUSES,
  COMMODITIES,
  type DealStatus,
} from "@/types";

interface Deal {
  id: string;
  dealNumber: string;
  title: string;
  commodity: string;
  quantity: number;
  unit: string;
  value: number;
  currency: string;
  status: DealStatus;
  createdAt: string;
  parties: { user: { name: string }; role: string }[];
  _count: { documents: number; messages: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (commodityFilter) params.set("commodity", commodityFilter);
    params.set("page", String(page));

    const res = await fetch(`/api/deals?${params}`);
    const data = await res.json();
    setDeals(data.deals || []);
    if (data.pagination) setPagination(data.pagination);
    setLoading(false);
  }, [search, statusFilter, commodityFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchDeals, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [fetchDeals, search]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setCommodityFilter("");
    setPage(1);
  }

  const hasFilters = search || statusFilter || commodityFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Rooms</h1>
          <p className="text-muted-foreground">
            All your commodity deal rooms in one place
          </p>
        </div>
        <Link href="/deals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal Room
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search deals..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {DEAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {DEAL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={commodityFilter || "all"} onValueChange={(v) => { setCommodityFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Commodities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Commodities</SelectItem>
            {COMMODITIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">
            {hasFilters ? "No deals match your filters" : "No deals found"}
          </p>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          ) : (
            <Link href="/deals/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first deal room
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-emerald-600 hover:underline font-medium"
                      >
                        {deal.dealNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell className="capitalize">{deal.commodity}</TableCell>
                    <TableCell>
                      {deal.currency} {deal.value.toLocaleString()}
                    </TableCell>
                    <TableCell>{deal.parties.length}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={DEAL_STATUS_COLORS[deal.status]}
                      >
                        {DEAL_STATUS_LABELS[deal.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {deals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <div className="border rounded-lg p-4 bg-background hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-emerald-600 font-medium">{deal.dealNumber}</span>
                    <Badge variant="secondary" className={DEAL_STATUS_COLORS[deal.status]}>
                      {DEAL_STATUS_LABELS[deal.status]}
                    </Badge>
                  </div>
                  <p className="font-medium mb-1">{deal.title}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">{deal.commodity}</span>
                    <span>{deal.currency} {deal.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{deal.parties.length} parties</span>
                    <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} deals
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
