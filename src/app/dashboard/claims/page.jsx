"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClaimOperationPopup from "./components/ClaimOperationPopup";
import CarrierBrand from "@/components/carrier-brand";
import {
  ArrowUpRight,
  CircleCheck,
  Clock,
  Download,
  FileText,
  Info,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

const claimStats = [
  {
    label: "Open",
    value: "1",
    helper: "Awaiting carrier review",
    icon: Info,
    iconClass: "bg-orange-50 text-orange-600 ring-orange-100",
    valueClass: "text-orange-500",
  },
  {
    label: "In Progress",
    value: "0",
    helper: "Evidence in review",
    icon: Clock,
    iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
    valueClass: "text-slate-950",
  },
  {
    label: "Resolved",
    value: "0",
    helper: "Closed this cycle",
    icon: CircleCheck,
    iconClass: "bg-green-50 text-green-700 ring-green-100",
    valueClass: "text-green-600",
  },
  {
    label: "Total Value",
    value: "$100",
    helper: "Recoverable variance",
    icon: Package,
    iconClass: "bg-red-50 text-red-600 ring-red-100",
    valueClass: "text-red-500",
  },
];

const claims = [
  {
    id: "#CLM-0001",
    carrier: "UPS",
    type: "Overcharge",
    tracking: "500",
    amount: "$100.00",
    status: "Open",
    created: "May 7, 2026",
    owner: "Billing Ops",
  },
];

export default function ClaimsPage() {
  const [claimPopupOpen, setClaimPopupOpen] = useState(false);

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
            <Button variant="outline" size="lg">
              <Download />
              Export XLSX
            </Button>
            <Button variant="outline" size="lg">
              <Download />
              Export CSV
            </Button>
            <Button size="lg" onClick={() => setClaimPopupOpen(true)}>
              <Plus />
              New Claim
            </Button>
          </div>
        </div>
        <div className="border-t border-purple-100 bg-purple-50/40 px-6 py-3 text-sm text-[#4b3b64]">
          Active claims are prioritized by recoverable amount, claim age, and carrier response status.
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {claimStats.map((stat) => {
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
            <div className="flex h-10 min-w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Search claims
            </div>
            <div className="w-full sm:w-48">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" title="Refresh claims">
              <RefreshCcw />
            </Button>
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="border-b last:border-0 hover:bg-purple-50/40">
                  <td className="px-4 py-4 font-semibold text-slate-950">{claim.id}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-700/10">
                      <CarrierBrand name={claim.carrier} />
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{claim.type}</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{claim.tracking}</td>
                  <td className="px-4 py-4 font-semibold text-red-600">{claim.amount}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-sm font-medium text-orange-700 ring-1 ring-orange-600/10">
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{claim.created}</td>
                  <td className="px-4 py-4 text-slate-700">{claim.owner}</td>
                  <td className="px-4 py-4">
                    <div className="w-44">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
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
      </Card>

      <ClaimOperationPopup
        open={claimPopupOpen}
        onOpenChange={setClaimPopupOpen}
      />
    </div>
  );
}
