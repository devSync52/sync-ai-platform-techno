"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardPagination from "@/components/DashboardPagination";
import { FetchSlaDashboardAction, SLA_AT_RISK_LIMIT, defaultSlaMetrics, defaultSlaPagination } from "@/services/actions/orders";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Bot, CalendarDays, Car, CircleCheck, CircleX, Clock, MapPin, Plus, RefreshCw, TrendingUp, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import moment from "moment";
import CarrierBrand from "@/components/carrier-brand";

const initialDateRange = {
    fromDate: moment().subtract(1, "month").format("YYYY-MM-DD"),
    toDate: moment().format("YYYY-MM-DD"),
};

const clientData = [
    { name: "Acme Corp", percent: 94, count: 120, color: "bg-green-600" },
    { name: "GlobalTrade", percent: 87, count: 89, color: "bg-purple-600" },
    { name: "FastShip Co", percent: 91, count: 210, color: "bg-green-600" },
    { name: "RetailMax", percent: 78, count: 55, color: "bg-yellow-500" },
    { name: "MedSupply", percent: 96, count: 75, color: "bg-green-600" },
];

const ProgressRow = ({ item }) => (
    <div className="mb-4 grid grid-cols-[minmax(120px,180px)_1fr_42px_72px] items-center gap-4">
        <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-700">{item.name}</div>
            {item.subLabel && <div className="mt-0.5 truncate text-xs text-gray-500">{item.subLabel}</div>}
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${item.percent}%` }}
            />
        </div>

        <span className="text-sm font-semibold text-gray-900">
            {item.percent}%
        </span>

        <span className="text-sm text-gray-500 text-right">{item.count}</span>
    </div>
);

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const total = payload.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const colors = { onTime: "#25c77a", late: "#ff6678", atRisk: "#ffc44d" };

    return (
        <div className="min-w-48 rounded-2xl border border-white/10 bg-[#160b28]/95 p-4 text-sm text-white shadow-[0_22px_55px_rgba(28,8,52,.32)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-5 border-b border-white/10 pb-2.5">
                <span className="font-semibold text-white">{label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#ddc8fa]">{total} total</span>
            </div>
            {payload.map((item) => (
                <div key={item.dataKey} className="mt-2 flex items-center justify-between gap-6 text-xs">
                    <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: colors[item.dataKey] }} />
                        {item.name == "onTime" ? "On Time" : item.name == "late" ? "Late" : "At Risk"}
                    </span>
                    <span className="font-bold text-white">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

const getLocation = (address = {}) => {
    return [address.city, address.province?.code || address.province?.name, address.postalcode].filter(Boolean).join(", ") || "-";
};

const getRouteDetails = (order) => {
    const origin = order?.initiation || {};
    const destination = order?.destination || {};

    return {
        originName: origin.name || origin.company || "Origin",
        originLocation: getLocation(origin),
        destinationName: destination.name || destination.company || "Destination",
        destinationLocation: getLocation(destination),
    };
};

const getDaysLeftLabel = (estimatedDeliveryDate) => {
    if (!estimatedDeliveryDate) return { label: "-", className: "bg-slate-50 text-slate-700 inset-ring-slate-600/10" };

    const target = moment(estimatedDeliveryDate);
    if (!target.isValid()) return { label: "-", className: "bg-slate-50 text-slate-700 inset-ring-slate-600/10" };

    const daysLeft = target.startOf("day").diff(moment().startOf("day"), "days");
    const dateLabel = target.format("MMM D, YYYY");

    if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, detail: dateLabel, className: "bg-red-50 text-red-700 inset-ring-red-600/10" };
    if (daysLeft == 0) return { label: "Due today", detail: dateLabel, className: "bg-red-50 text-red-700 inset-ring-red-600/10" };
    if (daysLeft == 1) return { label: "1 day left", detail: dateLabel, className: "bg-orange-50 text-orange-700 inset-ring-orange-600/10" };
    return { label: `${daysLeft} days left`, detail: dateLabel, className: "bg-amber-50 text-amber-700 inset-ring-amber-600/10" };
};

export default function SlaKpiPage() {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(SLA_AT_RISK_LIMIT);
    const [draftDateRange, setDraftDateRange] = useState(initialDateRange);
    const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);

    const details = { atRiskOrders: [], performance: [], deliveryTrend: [], pagination: defaultSlaPagination, metrics: defaultSlaMetrics }
    const { slaDashboard = details, slaLoading, slaError, message, } = useSelector((state) => state.orders);

    const fetchSlaDashboard = useCallback(() => {
        const dateParams = {
            ...(appliedDateRange.fromDate ? { fromDate: appliedDateRange.fromDate } : {}),
            ...(appliedDateRange.toDate ? { toDate: appliedDateRange.toDate } : {}),
        };

        dispatch(FetchSlaDashboardAction({ page, limit: rowsPerPage, ...dateParams })).catch(() => { });
    }, [appliedDateRange.fromDate, appliedDateRange.toDate, dispatch, page, rowsPerPage]);

    useEffect(() => {
        fetchSlaDashboard()
    }, [fetchSlaDashboard]);

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
    };

    const handleRowsPerPageChange = (nextLimit) => {
        setPage(1);
        setRowsPerPage(nextLimit);
    };

    const handleDateChange = (key, value) => {
        setDraftDateRange((current) => ({ ...current, [key]: value }));
    };

    const handleApplyDateRange = () => {
        setPage(1);
        setAppliedDateRange(draftDateRange);
    };

    const handleResetDateRange = () => {
        setPage(1);
        setDraftDateRange(initialDateRange);
        setAppliedDateRange(initialDateRange);
    };

    const metrics = { ...defaultSlaMetrics, ...(slaDashboard.metrics || {}) };
    const trendTotals = useMemo(() => (slaDashboard.deliveryTrend || []).reduce((totals, item) => ({
        onTime: totals.onTime + Number(item.onTime || 0),
        late: totals.late + Number(item.late || 0),
        atRisk: totals.atRisk + Number(item.atRisk || 0),
    }), { onTime: 0, late: 0, atRisk: 0 }), [slaDashboard.deliveryTrend]);

    const slaPerformance = useMemo(() => (slaDashboard.performance || []).map((item) => ({
        name: item.name || "-", subLabel: item.carrierName || "-",
        percent: item.percentage || 0, count: `${item.packages || 0} pkgs`,
        color: (item.percentage || 0) >= 50 ? "bg-green-600" : (item.percentage || 0) > 0 ? "bg-amber-500" : "bg-slate-300",
    })), [slaDashboard.performance]);

    const clientPerformance = useMemo(() => (slaDashboard.clientPerformance || []).map((item) => ({
        name: item.name || "-", subLabel: item.email || "-",
        percent: item.percentage || 0, count: `${item.packages || 0} pkgs`,
        color: (item.percentage || 0) >= 50 ? "bg-green-600" : (item.percentage || 0) > 0 ? "bg-amber-500" : "bg-slate-300",
    })), [slaDashboard.clientPerformance]);

    const error = slaError ? (message || "Unable to fetch SLA data.") : "";

    return (
        <div className="min-h-0 flex-1 space-y-6 overflow-auto bg-[#faf9fc] py-6 px-4 xl:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-normal text-[#090514]">SLA & KPI Dashboard</h1>
                    <p className="max-w-2xl text-sm text-[#68607f]">On-time performance, at-risk orders, and carrier SLA compliance across active shipments.</p>
                </div>
            </div>

            <Card className="rounded-xl border-[#ece8f2] bg-white p-4 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-base font-semibold text-[#090514]">
                            <CalendarDays className="size-4 text-primary" />
                            Date Range
                        </div>
                        <p className="mt-1 text-sm text-[#68607f]">
                            Filter SLA metrics by order date using <span className="font-medium">fromDate</span> and <span className="font-medium">toDate</span>.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(160px,190px)_minmax(160px,190px)_auto_auto] sm:items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4b4260]" htmlFor="sla-from-date">From Date</label>
                            <Input
                                id="sla-from-date"
                                type="date"
                                value={draftDateRange.fromDate}
                                max={draftDateRange.toDate || undefined}
                                onChange={(event) => handleDateChange("fromDate", event.target.value)}
                                className="bg-white py-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4b4260]" htmlFor="sla-to-date">To Date</label>
                            <Input
                                id="sla-to-date"
                                type="date"
                                value={draftDateRange.toDate}
                                min={draftDateRange.fromDate || undefined}
                                onChange={(event) => handleDateChange("toDate", event.target.value)}
                                className="bg-white py-2"
                            />
                        </div>
                        <Button type="button" onClick={handleApplyDateRange} disabled={slaLoading}>
                            <CalendarDays />
                            Apply
                        </Button>
                        <Button type="button" variant="outline" onClick={handleResetDateRange} disabled={slaLoading}>
                            <X />
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>

            {/* <Card className="p-4 bg-white">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Last 30 days" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectGroup className="w-full">
                                    <SelectItem value="30day" defaultChecked>Last 30 days</SelectItem>
                                    <SelectItem value="7day">Last 7 days</SelectItem>
                                    <SelectItem value="90day">Last 90 days</SelectItem>
                                    <SelectItem value="year">Year to date</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Carriers" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectGroup className="w-full">
                                    <SelectItem value="all" defaultChecked>All carriers</SelectItem>
                                    <SelectItem value="usps">USPS</SelectItem>
                                    <SelectItem value="fedex">FedEx</SelectItem>
                                    <SelectItem value="ups">UPS</SelectItem>
                                    <SelectItem value="gofo">Gofo</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectGroup className="w-full">
                                    <SelectItem value="allclients" defaultChecked>All Clients</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Warehouses" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectGroup className="w-full">
                                    <SelectItem value="allwarehouses" defaultChecked>All Warehouses</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Button>
                            <Download />
                            Export XLSX
                        </Button>
                    </div>
                    <div>
                        <Button variant="outline">
                            <Download />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </Card> */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Total  */}

                <div className="rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-lg font-semibold text-[#090514]">Total</span>
                            <p className="text-sm text-[#68607f]">
                                Shipments tracked
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Car size={30} color="#155dfc" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold leading-none text-[#090514]">{metrics.total?.value ?? 0}</h2>
                </div>

                {/* On-Time */}

                <div className="rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-lg font-semibold text-[#090514]">On-Time</span>
                            <p className="text-sm text-[#68607f]">
                                {metrics.onTime?.subtitle || "0 deliveries"}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
                            <CircleCheck size={30} color="#047c3b" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-green-600 leading-none">{metrics.onTime?.percentage ?? 0}%</h2>
                </div>

                {/* Late */}

                <div className="rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-lg font-semibold text-[#090514]">Late</span>
                            <p className="text-sm text-[#68607f]">
                                {metrics.late?.subtitle || "0 deliveries"}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <CircleX size={30} color="#dc2626" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-red-500 leading-none">{metrics.late?.percentage ?? 0}%</h2>
                </div>

                {/* At-Risk */}

                <div className="rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-lg font-semibold text-[#090514]">At-Risk</span>
                            <p className="text-sm text-[#68607f]">
                                {metrics.atRisk?.subtitle || "Orders at risk"}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <Clock size={30} color="#ea580c" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-orange-500 leading-none">{metrics.atRisk?.percentage ?? 0}%</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">

                {/* Left Card */}
                <div className="relative min-h-50 w-full overflow-hidden rounded-2xl border border-[#e8e0f1] bg-[linear-gradient(145deg,#ffffff_0%,#fcf9ff_58%,#f7f0ff_100%)] p-4 shadow-[0_14px_40px_rgba(54,25,87,.08)] lg:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#8b35e8]/8 blur-3xl" />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7620e9] to-[#ad4cf3] text-white shadow-[0_9px_22px_rgba(118,32,233,.24)]">
                                <TrendingUp className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-xl font-bold tracking-[-.02em] text-[#1b1027]">Weekly Delivery Trend</h2>
                                <p className="mt-1 text-sm text-[#756982]">Shipment performance across the selected period.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />On Time <b>{trendTotals.onTime}</b></span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/80 px-3 py-1.5 text-rose-700"><span className="h-2 w-2 rounded-full bg-rose-500" />Late <b>{trendTotals.late}</b></span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50/80 px-3 py-1.5 text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-500" />At Risk <b>{trendTotals.atRisk}</b></span>
                        </div>
                    </div>

                    <div className="relative mt-6 h-85 rounded-2xl border border-white bg-white/70 px-2 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] sm:px-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={slaDashboard.deliveryTrend} margin={{ top: 8, right: 12, left: -10, bottom: 18 }} barCategoryGap="28%" barGap={5}>
                                <defs>
                                    <linearGradient id="onTimeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#25c77a" /><stop offset="100%" stopColor="#079a53" /></linearGradient>
                                    <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6678" /><stop offset="100%" stopColor="#e42f4c" /></linearGradient>
                                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc44d" /><stop offset="100%" stopColor="#ee9200" /></linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e9e2ef" strokeDasharray="5 6" vertical={false} />
                                <XAxis dataKey="week" axisLine={false} height={52} interval={0} minTickGap={0} tick={{ fill: "#766b82", fontSize: 10, fontWeight: 600 }} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} width={38} tick={{ fill: "#9a8fa5", fontSize: 11 }} />
                                <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(118,32,233,0.045)", radius: 12 }} />
                                <Bar dataKey="onTime" fill="url(#onTimeGradient)" radius={[8, 8, 3, 3]} maxBarSize={24} />
                                <Bar dataKey="late" fill="url(#lateGradient)" radius={[8, 8, 3, 3]} maxBarSize={24} />
                                <Bar dataKey="atRisk" fill="url(#riskGradient)" radius={[8, 8, 3, 3]} maxBarSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Card */}
                {/* <div className="flex min-h-50 flex-col justify-between rounded-xl bg-[#13002f] p-3 lg:p-6 shadow-[0_18px_48px_rgba(19,0,47,0.18)]">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Bot color="#dab2ff" />

                            <h3 className="text-white text-xl font-semibold">
                                AI Executive Summary
                            </h3>
                        </div>

                        <p className="text-[#b8b2d1] text-base leading-7">
                            Generate an AI-powered executive summary of your SLA
                            performance with actionable recommendations.
                        </p>
                    </div>

                    <button className="mt-6 w-full bg-[#4a3d6a] hover:bg-[#5b4a82] transition-all text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2">
                        <Plus />
                        Generate Summary
                    </button>
                </div> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

                {/* Left Card */}
                <div className="rounded-xl border border-[#ece8f2] bg-white p-3 lg:p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by Client
                    </h2>
                    {slaLoading ? (
                        <div className="py-4 text-sm text-slate-500">Loading SLA performance...</div>
                    ) : !clientPerformance.length ? (
                        <div className="py-4 text-sm text-slate-500">No SLA performance data found.</div>
                    ) : clientPerformance.map((item) => (
                        <ProgressRow key={`${item.name}-${item.subLabel}`} item={item} />
                    ))}
                </div>

                {/* Right Card */}
                <div className="rounded-xl border border-[#ece8f2] bg-white p-3 lg:p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by SLA Type
                    </h2>

                    {slaLoading ? (
                        <div className="py-4 text-sm text-slate-500">Loading SLA performance...</div>
                    ) : !slaPerformance.length ? (
                        <div className="py-4 text-sm text-slate-500">No SLA performance data found.</div>
                    ) : slaPerformance.map((item) => (
                        <ProgressRow key={`${item.name}-${item.subLabel}`} item={item} />
                    ))}
                </div>
            </div>

            <Card className="rounded-xl border-[#ece8f2] bg-white p-3 lg:p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-xl font-semibold">At-Risk Orders</div>
                    <Button variant="outline" size="icon" type="button" disabled={slaLoading} onClick={fetchSlaDashboard}>
                        <RefreshCw className={slaLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
                {error && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3">Tracking </th>
                                <th className="py-2 pr-3">Carrier</th>
                                <th className="py-2 pr-3">Client</th>
                                <th className="py-2 pr-3">SLA</th>
                                <th className="min-w-85 py-2 pr-3">Route Details</th>
                                <th className="py-2 pr-3">Days Left</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slaLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        Loading at-risk orders...
                                    </td>
                                </tr>
                            ) : !slaDashboard.atRiskOrders.length ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        No at-risk orders found.
                                    </td>
                                </tr>
                            ) : slaDashboard.atRiskOrders.map((order) => {
                                const daysLeft = getDaysLeftLabel(order?.estimatedDeliveryDate);
                                const route = getRouteDetails(order);

                                return (
                                    <tr key={order?.id || order?.orderId || order?.waybillNumber} className="border-b align-top last:border-0">
                                        <td className="py-4 pr-3">
                                            <div className="font-semibold text-slate-950">{order?.waybillNumber || order?.orderId || "-"}</div>
                                            <div className="mt-1 text-xs text-slate-500">{order?.referenceNumber || order?.orderId || "-"}</div>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-700/10">
                                                <CarrierBrand name={order?.carrier?.name} />
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">{order?.destination?.company || order?.destination?.name || "-"}</td>
                                        <td className="py-2 pr-3">{order?.service?.name || "-"}</td>
                                        <td className="py-3 pr-3">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                                                            <MapPin className="size-3.5 text-blue-500" />
                                                            From
                                                        </div>
                                                        <div className="mt-1 truncate font-semibold text-slate-950">{route.originName}</div>
                                                        <div className="text-xs text-slate-500">{route.originLocation}</div>
                                                    </div>
                                                    <ArrowRight className="size-4 text-slate-400" />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                                                            <MapPin className="size-3.5 text-amber-500" />
                                                            To
                                                        </div>
                                                        <div className="mt-1 truncate font-semibold text-slate-950">{route.destinationName}</div>
                                                        <div className="text-xs text-slate-500">{route.destinationLocation}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-3">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium inset-ring ${daysLeft.className}`}>
                                                {daysLeft.label}
                                            </span>
                                            {daysLeft.detail && <div className="mt-1 text-xs text-slate-500">{daysLeft.detail}</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <DashboardPagination
                    pagination={slaDashboard?.pagination} currentPage={page} loading={slaLoading}
                    itemCount={slaDashboard?.atRiskOrders?.length || 0} onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25, 50]}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Card>
        </div>
    );
}
