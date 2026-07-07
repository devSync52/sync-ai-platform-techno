"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/config/axios";
import { API_URL, PROJECT_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardPagination from "@/components/DashboardPagination";
import CarrierBrand from "@/components/carrier-brand";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  CircleCheck,
  Clock,
  Download,
  FileText,
  Info,
  Package,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

const pageLimit = 10;
const emptyStats = { total: 0, open: 0, inProgress: 0, resolved: 0, totalValue: 0 };
const initialPagination = { page: 1, rowCount: pageLimit, total: 0, offset: 0, totalPages: 1 };

export default function ClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "all", carrier: "all" });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== "all")),
        page,
        limit: pageLimit,
      };
      const { data } = await axiosInstance.get(API_URL.CLAIMS, { params });
      setClaims((data.data || []).map(normalizeClaim));
      setStats(data.stats || emptyStats);
      setPagination(data.pagination || initialPagination);
    } catch (error) {
      toast.error(apiError(error) || "Could not load claims");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(fetchClaims, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchClaims, filters.search]);

  const statCards = useMemo(() => [
    {
      label: "Open",
      value: stats.open,
      helper: "Awaiting carrier review",
      icon: Info,
      iconClass: "bg-orange-50 text-orange-600 ring-orange-100",
      valueClass: "text-orange-500",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      helper: "Evidence in review",
      icon: Clock,
      iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
      valueClass: "text-slate-950",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      helper: "Closed this cycle",
      icon: CircleCheck,
      iconClass: "bg-green-50 text-green-700 ring-green-100",
      valueClass: "text-green-600",
    },
    {
      label: "Total Value",
      value: money(stats.totalValue),
      helper: "Recoverable variance",
      icon: Package,
      iconClass: "bg-red-50 text-red-600 ring-red-100",
      valueClass: "text-red-500",
    },
  ], [stats]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateStatus = async (claim, status) => {
    setUpdatingId(claim.id);
    try {
      await axiosInstance.patch(API_URL.CLAIM_BY_ID(claim.id), { status });
      toast.success("Claim status updated");
      await fetchClaims();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setUpdatingId("");
    }
  };

  const exportCsv = () => {
    if (!claims.length) return toast.error("There are no claims to export");
    const headings = ["ID", "Carrier", "Type", "Tracking", "Amount", "Priority", "Status", "Discrepancy", "Created"];
    const values = claims.map((claim) => [
      claim.displayId,
      label(claim.carrier),
      label(claim.type),
      claim.trackingNumber,
      claim.amount,
      label(claim.priority),
      label(claim.status),
      claim.discrepancyDisplayId,
      new Date(claim.createdAt).toISOString(),
    ]);
    const csv = [headings, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `claims-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-primary ring-1 ring-purple-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">
                Claims workspace
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Claims Management</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Open, track, and resolve freight billing claims with carriers.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" size="lg" onClick={fetchClaims} disabled={loading}>
              <RefreshCcw className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button variant="outline" size="lg" onClick={exportCsv}>
              <Download />
              Export CSV
            </Button>
            <Button size="lg" onClick={() => { window.location.href = PROJECT_URL.DASHBOARD_DISCREPANCIES; }}>
              Create from Discrepancy
            </Button>
          </div>
        </div>
        <div className="border-t border-purple-100 bg-purple-50/40 px-6 py-3 text-sm text-[#4b3b64]">
          Claims are created from discrepancy records, then tracked here through carrier review.
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-[#4B5A8A]">{stat.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.helper}</div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${stat.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h2 className={`text-4xl font-bold leading-none ${stat.valueClass}`}>{stat.value}</h2>
            </div>
          );
        })}
      </div>

      <Card className="bg-white p-0 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <FileText className="h-5 w-5 text-primary" />
              Claims
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Review open claims and update their carrier workflow status.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search claims"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filters.status} onValueChange={(value) => setFilter("status", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={filters.carrier} onValueChange={(value) => setFilter("carrier", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="veryk">Veryk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Discrepancy</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">Loading claims...</td></tr>
              ) : !claims.length ? (
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">No claims match these filters.</td></tr>
              ) : claims.map((claim) => (
                <tr key={claim.id} className="border-b last:border-0 hover:bg-purple-50/40">
                  <td className="px-4 py-4 font-semibold text-slate-950">{claim.displayId}</td>
                  <td className="px-4 py-4"><CarrierBrand name={label(claim.carrier)} /></td>
                  <td className="px-4 py-4 text-slate-700">{label(claim.type)}</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{claim.trackingNumber}</td>
                  <td className="px-4 py-4 font-semibold text-red-600">{money(claim.amount)}</td>
                  <td className="px-4 py-4"><PriorityBadge value={claim.priority} /></td>
                  <td className="px-4 py-4"><StatusBadge value={claim.status} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{date(claim.createdAt)}</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">{claim.discrepancyDisplayId}</td>
                  <td className="px-4 py-4">
                    <div className="w-44">
                      <Select value={claim.status} onValueChange={(value) => updateStatus(claim, value)} disabled={updatingId === claim.id}>
                        <SelectTrigger>
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="in-review">In Review</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DashboardPagination
          className="mx-4 mb-4"
          pagination={pagination}
          itemCount={claims.length}
          loading={loading}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}

function normalizeClaim(row) {
  return {
    ...row,
    displayId: `#CLM-${row.id.slice(0, 8).toUpperCase()}`,
    discrepancyDisplayId: row.discrepancyId ? `#DSC-${row.discrepancyId.slice(0, 8).toUpperCase()}` : "-",
    amount: Number(row.amount),
  };
}

function PriorityBadge({ value }) {
  const style = value === "high" ? "bg-red-50 text-red-700 ring-red-600/10" : value === "medium" ? "bg-amber-50 text-amber-700 ring-amber-600/10" : "bg-green-50 text-green-700 ring-green-600/10";
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ${style}`}>{label(value)}</span>;
}

function StatusBadge({ value }) {
  const style = value === "open" ? "bg-orange-50 text-orange-700 ring-orange-600/10" : ["resolved", "closed"].includes(value) ? "bg-green-50 text-green-700 ring-green-600/10" : "bg-blue-50 text-blue-700 ring-blue-600/10";
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ${style}`}>{label(value)}</span>;
}

function label(value = "") {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function date(value) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function apiError(error) {
  return error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Something went wrong";
}
