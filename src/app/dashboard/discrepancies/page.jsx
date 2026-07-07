"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CarrierBrand from "@/components/carrier-brand";
import DashboardPagination from "@/components/DashboardPagination";
import DiscrepancyClaimPopup from "./components/DiscrepancyClaimPopup";
import DiscrepancyOperationPopup from "./components/DiscrepancyOperationPopup";
import toast from "react-hot-toast";
import { AlertTriangle, CircleDot, Download, FileSearch, Plus, RefreshCw, Search, ShieldAlert, TrendingDown } from "lucide-react";

const emptyStats = { total: 0, totalVariance: 0, open: 0, highSeverity: 0 };
const initialFilters = { search: "", type: "all", severity: "all", status: "active", carrier: "all" };
const pageLimit = 10;
const initialPagination = { page: 1, rowCount: pageLimit, total: 0, offset: 0, totalPages: 1 };

export default function Discrepancies() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operationOpen, setOperationOpen] = useState(false);
  const [claimPopup, setClaimPopup] = useState({ open: false, discrepancy: null });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== "all")),
        page,
        limit: pageLimit,
      };
      const { data } = await axiosInstance.get(API_URL.DISCREPANCIES, { params });
      setRows((data.data || []).map(normalize));
      setStats(data.stats || emptyStats);
      setPagination(data.pagination || initialPagination);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load discrepancies");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pagination.rowCount]);

  useEffect(() => {
    const timer = setTimeout(fetchRows, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchRows, filters.search]);

  const statCards = useMemo(() => [
    { label: "Total Discrepancies", value: stats.total, icon: FileSearch, color: "text-slate-950" },
    { label: "Total Variance", value: money(stats.totalVariance), icon: TrendingDown, color: "text-red-500" },
    { label: "Open", value: stats.open, icon: CircleDot, color: "text-orange-500" },
    { label: "High Severity", value: stats.highSeverity, icon: ShieldAlert, color: "text-red-500" },
  ], [stats]);

  const createDiscrepancy = async (payload) => {
    setSaving(true);
    try {
      await axiosInstance.post(API_URL.DISCREPANCIES, payload);
      toast.success("Discrepancy created");
      setOperationOpen(false);
      await fetchRows();
    } catch (error) {
      toast.error(apiError(error));
    } finally { setSaving(false); }
  };

  const createClaim = async (payload) => {
    setSaving(true);
    try {
      await axiosInstance.post(API_URL.DISCREPANCY_CLAIMS(claimPopup.discrepancy.id), payload);
      toast.success("Claim created and discrepancy marked as claimed");
      setClaimPopup({ open: false, discrepancy: null });
      await fetchRows();
    } catch (error) {
      toast.error(apiError(error));
    } finally { setSaving(false); }
  };

  const updateStatus = async (row, status) => {
    try {
      await axiosInstance.patch(API_URL.DISCREPANCY_BY_ID(row.id), { status });
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, status } : item));
      await fetchRows();
      toast.success("Status updated");
    } catch (error) { toast.error(apiError(error)); }
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error("There are no filtered discrepancies to export");
    const headings = ["ID","Carrier","Type","Tracking","Invoice ID","Expected","Billed","Variance","Severity","Status","Created"];
    const values = rows.map((row) => [row.displayId,label(row.carrier),label(row.type),row.trackingNumber,row.invoiceId || "",row.expectedAmount,row.billedAmount,row.variance,label(row.severity),label(row.status),new Date(row.createdAt).toISOString()]);
    const csv = [headings, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `discrepancies-${new Date().toISOString().slice(0,10)}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-purple-50 p-3 text-primary"><AlertTriangle /></div>
            <div><h1 className="text-2xl font-bold text-primary">Discrepancy Analysis</h1>
              <p className="mt-1 text-sm text-muted-foreground">Review billing variances and turn recoverable discrepancies into claims.</p></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="lg" onClick={fetchRows} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button variant="outline" size="lg" onClick={exportCsv}><Download />Export CSV</Button>
            <Button size="lg" onClick={() => setOperationOpen(true)}><Plus />New Discrepancy</Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label: text, value, icon: Icon, color }) => <div key={text} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between"><span className="font-semibold text-[#4B5A8A]">{text}</span><Icon className="h-5 w-5 text-primary" /></div>
          <div className={`mt-5 text-4xl font-bold ${color}`}>{value}</div>
        </div>)}
      </div>

      <Card className="bg-white p-0 shadow-sm">
        <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={filters.search} onChange={(e) => setFilter("search", e.target.value)} placeholder="Tracking, invoice, carrier..." /></div>
          <Filter value={filters.type} onChange={(v) => setFilter("type", v)} options={[["all","All Types"],["overcharge","Overcharge"],["dim-weight","Dim Weight"],["rate-mismatch","Rate Mismatch"],["fuel-surcharge","Fuel Surcharge"],["residential","Residential"]]} />
          <Filter value={filters.severity} onChange={(v) => setFilter("severity", v)} options={[["all","All Severities"],["high","High"],["medium","Medium"],["low","Low"]]} />
          <Filter value={filters.status} onChange={(v) => setFilter("status", v)} options={[["active","Active"],["all","All Statuses"],["open","Open"],["in-review","In Review"],["claimed","Claimed"],["resolved","Resolved"]]} />
          <Filter value={filters.carrier} onChange={(v) => setFilter("carrier", v)} options={[["all","All Carriers"],["ups","UPS"],["fedex","FedEx"],["usps","USPS"],["veryk","Veryk"]]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-muted-foreground"><tr>{["ID","Carrier","Type","Tracking","Variance","Severity","Status","Created","Actions"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Loading discrepancies…</td></tr>
                : !rows.length ? <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">No discrepancies match these filters.</td></tr>
                : rows.map((row) => <tr key={row.id} className="border-b hover:bg-purple-50/40">
                  <td className="px-4 py-4 font-semibold">{row.displayId}</td>
                  <td className="px-4 py-4"><CarrierBrand name={label(row.carrier)} /></td>
                  <td className="px-4 py-4">{label(row.type)}</td><td className="px-4 py-4 font-mono">{row.trackingNumber}</td>
                  <td className="px-4 py-4 font-semibold text-red-600">{money(row.variance)}</td>
                  <td className="px-4 py-4"><Badge value={row.severity} /></td>
                  <td className="px-4 py-4"><Filter value={row.status} onChange={(v) => updateStatus(row, v)} disabled={row.status === "claimed"} options={[["open","Open"],["in-review","In Review"],["claimed","Claimed"],["resolved","Resolved"]]} /></td>
                  <td className="px-4 py-4 text-muted-foreground">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(row.createdAt))}</td>
                  <td className="px-4 py-4"><Button variant="outline" size="sm" disabled={Boolean(row.claim) || ["claimed", "resolved"].includes(row.status)} onClick={() => setClaimPopup({ open: true, discrepancy: row })}><Plus />{row.claim ? "Claimed" : "Claim"}</Button></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <DashboardPagination
          className="mx-4 mb-4"
          pagination={pagination}
          itemCount={rows.length}
          loading={loading}
          onPageChange={setPage}
        />
      </Card>
      <DiscrepancyOperationPopup open={operationOpen} onOpenChange={setOperationOpen} onSubmit={createDiscrepancy} saving={saving} />
      <DiscrepancyClaimPopup open={claimPopup.open} discrepancy={claimPopup.discrepancy} onOpenChange={(open) => setClaimPopup((current) => ({ open, discrepancy: open ? current.discrepancy : null }))} onSubmit={createClaim} saving={saving} />
    </div>
  );
}

function Filter({ value, onChange, options, disabled }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>; }
function Badge({ value }) { const style = value === "high" ? "bg-red-50 text-red-700" : value === "medium" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"; return <span className={`rounded-md px-2.5 py-1 font-medium ${style}`}>{label(value)}</span>; }
function normalize(row) { return { ...row, displayId: `#DSC-${row.id.slice(0, 8).toUpperCase()}`, expectedAmount: Number(row.expectedAmount), billedAmount: Number(row.billedAmount), variance: Math.abs(Number(row.billedAmount) - Number(row.expectedAmount)) }; }
function label(value = "") { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0); }
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function apiError(error) { return error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Something went wrong"; }
