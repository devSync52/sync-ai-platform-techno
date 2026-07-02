"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DiscrepancyClaimPopup from "./components/DiscrepancyClaimPopup";
import DiscrepancyOperationPopup from "./components/DiscrepancyOperationPopup";
import CarrierBrand from "@/components/carrier-brand";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
  Download,
  FileSearch,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";

const discrepancyStats = [
  {
    label: "Total Discrepancies",
    value: "1",
    helper: "Detected from invoice audit",
    icon: FileSearch,
    iconClass: "bg-slate-100 text-slate-700 ring-slate-200",
    valueClass: "text-slate-950",
  },
  {
    label: "Total Variance",
    value: "$100",
    helper: "Potential claim amount",
    icon: TrendingDown,
    iconClass: "bg-red-50 text-red-600 ring-red-100",
    valueClass: "text-red-500",
  },
  {
    label: "Open",
    value: "1",
    helper: "Needs review",
    icon: CircleDot,
    iconClass: "bg-orange-50 text-orange-600 ring-orange-100",
    valueClass: "text-orange-500",
  },
  {
    label: "High Severity",
    value: "0",
    helper: "At-risk billing events",
    icon: ShieldAlert,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
    valueClass: "text-red-500",
  },
];

const discrepancies = [
  {
    id: "#DSC-0001",
    carrier: "UPS",
    type: "Overcharge",
    tracking: "500",
    amount: "$100.00",
    status: "Open",
    severity: "Medium",
    created: "May 7, 2026",
  },
];

export default function Discrepancies() {
  const [discrepancyPopupOpen, setDiscrepancyPopupOpen] = useState(false);
  const [claimPopup, setClaimPopup] = useState({ open: false, discrepancy: null });

  return (
    <div className="space-y-6 p-6">
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-primary ring-1 ring-purple-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">
                Invoice variance monitor
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Discrepancy Analysis</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Billing variances categorized by type - create claims directly from any discrepancy.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" size="lg">
              <Download />
              Export CSV
            </Button>
            <Button variant="outline" size="lg" onClick={() => setDiscrepancyPopupOpen(true)}>
              <Plus />
              New Discrepancy
            </Button>
            <Button size="lg" onClick={() => setClaimPopup({ open: true, discrepancy: discrepancies[0] })}>
              <Plus />
              Create Claim
            </Button>
          </div>
        </div>
        <div className="grid gap-3 border-t border-purple-100 bg-purple-50/40 px-6 py-3 text-sm text-[#4b3b64] md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-ready discrepancy explanations
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filter by carrier, severity, status, and type
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Prioritize recoverable billing events
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {discrepancyStats.map((stat) => {
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
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <FileSearch className="h-5 w-5 text-primary" />
                Filters
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Narrow discrepancies by billing category and claim readiness.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_180px_180px_180px_180px]">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                Search tracking
              </div>
              <FilterSelect placeholder="All Type" items={["All Type", "Dim Weight", "Rate Mismatch", "Fuel Surcharge", "Residential"]} />
              <FilterSelect placeholder="All Severity" items={["All Severity", "High", "Medium", "Low"]} />
              <FilterSelect placeholder="All Status" items={["All Status", "Open", "In Review", "Claimed", "Resolved"]} />
              <FilterSelect placeholder="All Carrier" items={["All Carrier", "UPS", "FedEx", "USPS", "Veryk"]} />
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
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-purple-50/40">
                  <td className="px-4 py-4 font-semibold text-slate-950">{item.id}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-700/10">
                      <CarrierBrand name={item.carrier} />
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{item.type}</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{item.tracking}</td>
                  <td className="px-4 py-4 font-semibold text-red-600">{item.amount}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700 ring-1 ring-amber-600/10">
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-sm font-medium text-orange-700 ring-1 ring-orange-600/10">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{item.created}</td>
                  <td className="px-4 py-4">
                    <Button variant="outline" size="sm" onClick={() => setClaimPopup({ open: true, discrepancy: item })}>
                      <Plus />
                      Claim
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DiscrepancyOperationPopup
        open={discrepancyPopupOpen}
        onOpenChange={setDiscrepancyPopupOpen}
      />

      <DiscrepancyClaimPopup
        open={claimPopup.open}
        discrepancy={claimPopup.discrepancy}
        onOpenChange={(open) => setClaimPopup({ open, discrepancy: open ? claimPopup.discrepancy : null })}
      />
    </div>
  );
}

function FilterSelect({ placeholder, items }) {
  return (
    <Select>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item} value={item.toLowerCase().replaceAll(" ", "-")}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
