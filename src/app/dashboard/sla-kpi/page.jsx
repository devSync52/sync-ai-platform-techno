"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardPagination from "@/components/DashboardPagination";
import { FetchSlaDashboardAction, SLA_AT_RISK_LIMIT, defaultSlaMetrics, defaultSlaPagination } from "@/services/actions/orders";
import { useDispatch, useSelector } from "react-redux";
import { Bot, Car, CircleCheck, CircleX, Clock, Plus, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const atRiskLimit = SLA_AT_RISK_LIMIT;

const clientData = [
    { name: "Acme Corp", percent: 94, count: 120, color: "bg-green-600" },
    { name: "GlobalTrade", percent: 87, count: 89, color: "bg-purple-600" },
    { name: "FastShip Co", percent: 91, count: 210, color: "bg-green-600" },
    { name: "RetailMax", percent: 78, count: 55, color: "bg-yellow-500" },
    { name: "MedSupply", percent: 96, count: 75, color: "bg-green-600" },
];

const slaData = [
    { name: "Next Day", percent: 88, count: "145 pkgs", color: "bg-purple-600" },
    { name: "2-Day", percent: 93, count: "280 pkgs", color: "bg-green-600" },
    { name: "Ground", percent: 96, count: "420 pkgs", color: "bg-green-600" },
    { name: "Economy", percent: 91, count: "180 pkgs", color: "bg-purple-600" },
];

const ProgressRow = ({ item }) => (
    <div className="grid grid-cols-[100px_1fr_24px_60px] items-center gap-4 mb-4">
        <span className="text-sm text-gray-600">{item.name}</span>

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

    return (
        <div className="rounded-3xl border border-[#3f2d5f] bg-[#110923] p-4 text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="mb-2 text-sm font-semibold text-white">{label}</div>
            {payload.map((item) => (
                <div key={item.dataKey} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        {item.name == "onTime" ? "On Time" : item.name == "late" ? "Late" : "At Risk"}
                    </span>
                    <span className="font-semibold text-white">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

const getLocation = (address) => {
    return [address.city, address.province?.code || address.province?.name].filter(Boolean).join(", ") || "-";
};

const getOrderRoute = (order) => {
    const origin = getLocation(order?.initiation), destination = getLocation(order?.destination);

    if (origin == "-" && destination == "-") return "-";
    return `${origin} -> ${destination}`;
};

const getDaysLeftLabel = (estimatedDeliveryDate) => {
    if (!estimatedDeliveryDate) return { label: "-", className: "bg-slate-50 text-slate-700 inset-ring-slate-600/10" };

    const today = new Date();
    const target = new Date(estimatedDeliveryDate);
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, className: "bg-red-50 text-red-700 inset-ring-red-600/10" };
    if (daysLeft == 0) return { label: "Due Today", className: "bg-red-50 text-red-700 inset-ring-red-600/10" };
    if (daysLeft == 1) return { label: "1 day left", className: "bg-orange-50 text-orange-700 inset-ring-orange-600/10" };
    return { label: `${daysLeft} days left`, className: "bg-amber-50 text-amber-700 inset-ring-amber-600/10" };
};

export default function SlaKpiPage() {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);

    const details = { atRiskOrders: [], deliveryTrend: [], pagination: defaultSlaPagination, metrics: defaultSlaMetrics, }
    const { slaDashboard = details, slaLoading, slaError, message, } = useSelector((state) => state.orders);

    const fetchSlaDashboard = useCallback(() => {
        dispatch(FetchSlaDashboardAction({ page, limit: atRiskLimit })).catch(() => { });
    }, [dispatch, page]);

    useEffect(() => {
        fetchSlaDashboard()
    }, [fetchSlaDashboard, page]);

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
    };

    const metrics = { ...defaultSlaMetrics, ...(slaDashboard.metrics || {}) };
    const weeklyTrendData = useMemo(() => slaDashboard.deliveryTrend, [slaDashboard.deliveryTrend]);
    const atRiskOrders = slaDashboard.atRiskOrders;
    const pagination = slaDashboard.pagination || defaultSlaPagination;
    const error = slaError ? (message || "Unable to fetch SLA data.") : "";

    return (
        <div className="min-h-0 flex-1 space-y-6 overflow-auto bg-[#faf9fc] p-6 xl:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-normal text-[#090514]">SLA & KPI Dashboard</h1>
                    <p className="max-w-2xl text-sm text-[#68607f]">On-time performance, at-risk orders, and carrier SLA compliance across active shipments.</p>
                </div>
            </div>

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

                <div className="min-h-42.5 rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
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

                <div className="min-h-42.5 rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
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

                <div className="min-h-42.5 rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
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

                <div className="min-h-42.5 rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left Card */}
                <div className="min-h-50 rounded-xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)] lg:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-[#090514]">Weekly Delivery Trend</h2>
                            <p className="mt-1 text-sm text-[#68607f]">On-time, late, and at-risk shipment volume by week.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />On Time</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Late</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />At Risk</span>
                        </div>
                    </div>

                    <div className="mt-6 h-85">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={slaDashboard.deliveryTrend} margin={{ top: 12, right: 18, left: -16, bottom: 0 }}>
                                <CartesianGrid stroke="#ece8f2" strokeDasharray="3 4" vertical={false} />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 12 }} />
                                <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                                <Bar dataKey="onTime" stackId="a" fill="#079a35" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="late" stackId="a" fill="#ff3b4f" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="atRisk" stackId="a" fill="#f6a500" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Card */}
                <div className="flex min-h-50 flex-col justify-between rounded-xl bg-[#13002f] p-6 shadow-[0_18px_48px_rgba(19,0,47,0.18)]">

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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

                {/* Left Card */}
                <div className="rounded-xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by Client
                    </h2>
                    {clientData.map((item, index) => (
                        <ProgressRow key={index} item={item} />
                    ))}
                </div>

                {/* Right Card */}
                <div className="rounded-xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by SLA Type
                    </h2>

                    {slaData.map((item, index) => (
                        <ProgressRow key={index} item={item} />
                    ))}
                </div>
            </div>

            <Card className="rounded-xl border-[#ece8f2] bg-white p-4 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
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
                                <th className="py-2 pr-3">Route</th>
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
                            ) : !atRiskOrders.length ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        No at-risk orders found.
                                    </td>
                                </tr>
                            ) : atRiskOrders.map((order) => {
                                const daysLeft = getDaysLeftLabel(order?.estimatedDeliveryDate);

                                return (
                                    <tr key={order?.id || order?.orderId || order?.waybillNumber} className="border-b last:border-0">
                                        <td className="py-2 pr-3 font-medium">{order?.waybillNumber || order?.orderId || "-"}</td>
                                        <td className="py-2 pr-3">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-700/10">
                                                {order?.carrier?.name}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">{order?.destination?.company || order?.destination.name || "-"}</td>
                                        <td className="py-2 pr-3">{order?.service?.name}</td>
                                        <td className="py-2 pr-3">{getOrderRoute(order)}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium inset-ring ${daysLeft.className}`}>
                                                {daysLeft.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <DashboardPagination
                    pagination={pagination} currentPage={page} loading={slaLoading}
                    itemCount={atRiskOrders.length} onPageChange={handlePageChange}
                />
            </Card>
        </div>
    );
}
