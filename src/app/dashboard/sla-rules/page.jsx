"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CarrierBrand from "@/components/carrier-brand";
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    FileSliders,
    Filter,
    Loader2,
    Pencil,
    Plus,
    RefreshCcw,
    Search,
    ShieldAlert,
    Timer,
    Trash2,
    Truck,
    Zap,
} from "lucide-react";
import SlaRuleOperationPopup from "./components/SlaRuleOperationPopup";
import { deleteSlaRule, fetchSlaRules } from "@/services/actions/sla-rules";

const statusLabels = {
    active: "Active",
    draft: "Draft",
    disabled: "Disabled",
};

const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
};

export default function SlaRulesPage() {
    const [operationOpen, setOperationOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [rules, setRules] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ carrierId: "all", serviceId: "all", status: "all" });

    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchSlaRules(filters);
            setRules(response.rules);
            setCarriers(response.carriers);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to load SLA rules");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadRules();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadRules]);

    const services = useMemo(() => {
        if (filters.carrierId && filters.carrierId !== "all") {
            return carriers.find((carrier) => carrier.id === filters.carrierId)?.services || [];
        }
        return carriers.flatMap((carrier) => carrier.services || []);
    }, [carriers, filters.carrierId]);

    const activeRules = rules.filter((rule) => rule.status === "active").length;
    const carrierRules = rules.filter((rule) => rule.carrierId).length;
    const avgCommitment = rules.length ? (rules.reduce((sum, rule) => sum + Number(rule.commitmentDays || 0), 0) / rules.length).toFixed(1) : "0";
    const avgRisk = rules.length ? (rules.reduce((sum, rule) => sum + Number(rule.riskDays || 0), 0) / rules.length).toFixed(1) : "0";

    const slaStats = [
        {
            label: "Active Rules",
            value: activeRules,
            helper: "Used in SLA scoring",
            icon: CheckCircle2,
            iconClass: "bg-green-50 text-green-700 ring-green-100",
            valueClass: "text-green-600",
        },
        {
            label: "Carrier Rules",
            value: carrierRules,
            helper: "Carrier-specific policies",
            icon: Truck,
            iconClass: "bg-blue-50 text-blue-700 ring-blue-100",
            valueClass: "text-slate-950",
        },
        {
            label: "Avg Risk Date",
            value: `${avgRisk}d`,
            helper: "After estimated delivery",
            icon: ShieldAlert,
            iconClass: "bg-orange-50 text-orange-700 ring-orange-100",
            valueClass: "text-orange-500",
        },
        {
            label: "Avg Commitment",
            value: `${avgCommitment}d`,
            helper: "Across active rules",
            icon: Timer,
            iconClass: "bg-purple-50 text-primary ring-purple-100",
            valueClass: "text-primary",
        },
    ];

    const handleCreate = () => {
        setSelectedRule(null);
        setOperationOpen(true);
    };

    const handleEdit = (rule) => {
        setSelectedRule(rule);
        setOperationOpen(true);
    };

    const handleDelete = async (rule) => {
        try {
            await deleteSlaRule(rule.id);
            toast.success("SLA rule deleted");
            loadRules();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to delete SLA rule");
        }
    };

    const handleSaved = () => {
        setOperationOpen(false);
        setSelectedRule(null);
        loadRules();
    };

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
                                Define carrier and service rules that decide late and at-risk status.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{activeRules} active</span>
                                <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{rules.length - activeRules} inactive</span>
                                <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold text-primary">Database backed</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-purple-100 bg-[#fbf8ff] p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-semibold text-slate-950">Policy health</div>
                                <p className="mt-1 text-xs leading-5 text-[#6d607d]">Specific carrier and service rules override fallback SLA logic.</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                                <Zap className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white p-3 shadow-sm">
                                <div className="text-xs text-muted-foreground">Carriers</div>
                                <div className="mt-1 text-xl font-bold text-slate-950">{carriers.length}</div>
                            </div>
                            <div className="rounded-xl bg-white p-3 shadow-sm">
                                <div className="text-xs text-muted-foreground">Rules</div>
                                <div className="mt-1 text-xl font-bold text-orange-500">{rules.length}</div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button variant="outline" size="lg" className="flex-1" onClick={loadRules} disabled={loading}>
                                <RefreshCcw className={loading ? "animate-spin" : ""} />
                                Refresh
                            </Button>
                            <Button size="lg" className="flex-1" onClick={handleCreate}>
                                <Plus />
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3 border-t border-purple-100 bg-purple-50/40 px-6 py-4 text-sm text-[#4b3b64] md:grid-cols-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Commitment days define service policy
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-primary" />
                        Risk date marks at-risk orders
                    </div>
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        Carrier/service rules come from DB
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
                        <p className="mt-1 text-sm text-muted-foreground">Manage rules used to calculate SLA late and at-risk status.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_180px_180px_180px]">
                        <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-muted-foreground">
                            <Search className="h-4 w-4" />
                            Search rules
                        </div>
                        <FilterSelect placeholder="All Carriers" value={filters.carrierId} onChange={(value) => setFilters((current) => ({ ...current, carrierId: value, serviceId: "all" }))} items={[{ label: "All Carriers", value: "all" }, ...carriers.map((carrier) => ({ label: carrier.name, value: carrier.id }))]} />
                        <FilterSelect placeholder="All Services" value={filters.serviceId} onChange={(value) => setFilters((current) => ({ ...current, serviceId: value }))} items={[{ label: "All Services", value: "all" }, ...services.map((service) => ({ label: service.name, value: service.id }))]} />
                        <FilterSelect placeholder="All Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} items={[{ label: "All Status", value: "all" }, { label: "Active", value: "active" }, { label: "Draft", value: "draft" }, { label: "Disabled", value: "disabled" }]} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#faf9fc] text-xs uppercase tracking-wide text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="px-4 py-3">Rule</th>
                                <th className="px-4 py-3">Carrier</th>
                                <th className="px-4 py-3">Service</th>
                                <th className="px-4 py-3">Commitment</th>
                                <th className="px-4 py-3">Risk Date</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                                        Loading SLA rules...
                                    </td>
                                </tr>
                            )}

                            {!loading && !rules.length && (
                                <tr>
                                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                                        No SLA rules found.
                                    </td>
                                </tr>
                            )}

                            {!loading && rules.map((rule) => (
                                <tr key={rule.id} className="border-b last:border-0 hover:bg-purple-50/40">
                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-slate-950">{rule.name}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{rule.id.slice(0, 8)}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {rule.carrier ? (
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-700/10">
                                                <CarrierBrand name={rule.carrier.name} />
                                            </span>
                                        ) : "All carriers"}
                                    </td>
                                    <td className="px-4 py-4 text-slate-700">{rule.service?.name || "All services"}</td>
                                    <td className="px-4 py-4 font-semibold text-slate-950">{rule.commitmentDays} days</td>
                                    <td className="px-4 py-4 text-orange-700">{rule.riskDays} days</td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-purple-700/10">
                                            {priorityLabels[rule.priority] || rule.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ${rule.status == "active" ? "bg-green-50 text-green-700 ring-green-600/10" : "bg-slate-100 text-slate-700 ring-slate-600/10"}`}>
                                            {statusLabels[rule.status] || rule.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                                                <Pencil />
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(rule)}>
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {operationOpen && (
                <SlaRuleOperationPopup
                    open={operationOpen}
                    onOpenChange={setOperationOpen}
                    carriers={carriers}
                    rule={selectedRule}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

function FilterSelect({ placeholder, items, value, onChange }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
