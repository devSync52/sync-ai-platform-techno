"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSliders,
  Filter,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Timer,
  Truck,
  Zap,
} from "lucide-react";
import SlaRuleOperationPopup from "./components/SlaRuleOperationPopup";

const slaStats = [
  {
    label: "Active Rules",
    value: "4",
    helper: "Used in SLA scoring",
    icon: CheckCircle2,
    iconClass: "bg-green-50 text-green-700 ring-green-100",
    valueClass: "text-green-600",
  },
  {
    label: "Carrier Rules",
    value: "3",
    helper: "Carrier-specific policies",
    icon: Truck,
    iconClass: "bg-blue-50 text-blue-700 ring-blue-100",
    valueClass: "text-slate-950",
  },
  {
    label: "At-Risk Window",
    value: "1d",
    helper: "Default warning threshold",
    icon: ShieldAlert,
    iconClass: "bg-orange-50 text-orange-700 ring-orange-100",
    valueClass: "text-orange-500",
  },
  {
    label: "Avg Commitment",
    value: "3.1d",
    helper: "Across active rules",
    icon: Timer,
    iconClass: "bg-purple-50 text-primary ring-purple-100",
    valueClass: "text-primary",
  },
];

const slaRules = [
  {
    id: "SLA-001",
    name: "UPS Ground Standard",
    carrier: "UPS",
    service: "Ground",
    zone: "2-5",
    commitment: "3 days",
    threshold: "1 day",
    priority: "High",
    status: "Active",
  },
  {
    id: "SLA-002",
    name: "FedEx Home Delivery",
    carrier: "FedEx",
    service: "Home Delivery",
    zone: "2-8",
    commitment: "4 days",
    threshold: "1 day",
    priority: "Medium",
    status: "Active",
  },
  {
    id: "SLA-003",
    name: "USPS Priority",
    carrier: "USPS",
    service: "Priority",
    zone: "All",
    commitment: "2 days",
    threshold: "12 hours",
    priority: "High",
    status: "Active",
  },
  {
    id: "SLA-004",
    name: "Economy Exception",
    carrier: "All",
    service: "Economy",
    zone: "6-8",
    commitment: "6 days",
    threshold: "2 days",
    priority: "Low",
    status: "Draft",
  },
];

export default function SlaRulesPage() {
  const [operationOpen, setOperationOpen] = useState(false);

  return (
    <div className="space-y-6 p-6 xl:p-8">
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-[0_18px_45px_rgba(35,19,62,0.08)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_16px_32px_rgba(103,0,231,0.22)]">
              <FileSliders className="h-6 w-6" />
            </div>
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">
                SLA configuration
                <CalendarClock className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-2xl font-bold text-primary">SLA Rules</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Define service level agreements by carrier, service type, zone, and client segment.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">4 active</span>
                <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">1 draft</span>
                <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">Carrier overrides enabled</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-[#fbf8ff] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">Policy health</div>
                <p className="mt-1 text-xs leading-5 text-[#6d607d]">Rules are evaluated from most specific to fallback defaults.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-xs text-muted-foreground">Coverage</div>
                <div className="mt-1 text-xl font-bold text-slate-950">92%</div>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-xs text-muted-foreground">Fallbacks</div>
                <div className="mt-1 text-xl font-bold text-orange-500">1</div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="lg" className="flex-1">
                <RefreshCcw />
                Refresh
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setOperationOpen(true)}>
                <Plus />
                Create
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-purple-100 bg-purple-50/40 px-6 py-4 text-sm text-[#4b3b64] md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Commitments drive due dates
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Thresholds mark at-risk orders
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Carrier rules override defaults
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {slaStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(27,18,44,0.10)]">
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

      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white p-0 shadow-[0_14px_35px_rgba(35,19,62,0.06)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-white p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <Filter className="h-5 w-5 text-primary" />
              Rule Library
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Manage the rules used to calculate SLA status and risk windows.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_180px_180px_180px]">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Search rules
            </div>
            <FilterSelect placeholder="All Carriers" items={["All Carriers", "UPS", "FedEx", "USPS", "Veryk"]} />
            <FilterSelect placeholder="All Services" items={["All Services", "Ground", "Home Delivery", "Priority", "Express"]} />
            <FilterSelect placeholder="All Status" items={["All Status", "Active", "Draft", "Disabled"]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf9fc] text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b text-left">
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Commitment</th>
                <th className="px-4 py-3">Warning</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slaRules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0 hover:bg-purple-50/40">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-950">{rule.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{rule.id}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-700/10">
                      {rule.carrier}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{rule.service}</td>
                  <td className="px-4 py-4 text-slate-700">{rule.zone}</td>
                  <td className="px-4 py-4 font-semibold text-slate-950">{rule.commitment}</td>
                  <td className="px-4 py-4 text-orange-700">{rule.threshold}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-purple-700/10">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ${rule.status == "Active" ? "bg-green-50 text-green-700 ring-green-600/10" : "bg-slate-100 text-slate-700 ring-slate-600/10"}`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Button variant="outline" size="sm" onClick={() => setOperationOpen(true)}>
                      <Pencil />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SlaRuleOperationPopup
        open={operationOpen}
        onOpenChange={setOperationOpen}
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
