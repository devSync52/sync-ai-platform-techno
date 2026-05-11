"use client";

import IconAsset from "@/components/IconAsset";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";

const metrics = [
    {
        title: "Total",
        value: "0",
        subtitle: "Shipments tracked",
        color: "bg-sky-50 text-sky-700",
        icon: "truck",
    },
    {
        title: "On-Time",
        value: "0%",
        subtitle: "0 deliveries",
        color: "bg-emerald-50 text-emerald-700",
        icon: "check",
    },
    {
        title: "Late",
        value: "0%",
        subtitle: "0 deliveries",
        color: "bg-red-50 text-red-700",
        icon: "close",
    },
    {
        title: "At-Risk",
        value: "0",
        subtitle: "Orders at risk",
        color: "bg-amber-50 text-amber-700",
        icon: "clock",
    },
];

const weeklyTrendData = [
    { week: "W1", onTime: 170, late: 16, atRisk: 9 },
    { week: "W2", onTime: 162, late: 20, atRisk: 10 },
    { week: "W3", onTime: 174, late: 14, atRisk: 11 },
    { week: "W4", onTime: 169, late: 19, atRisk: 12 },
    { week: "W5", onTime: 182, late: 15, atRisk: 8 },
    { week: "W6", onTime: 188, late: 13, atRisk: 7 },
];

const clientPerformance = [
    { label: "Acme Corp", score: 94, value: 120, color: "#079a35" },
    { label: "GlobalTrade", score: 87, value: 89, color: "#7400e8" },
    { label: "FastShip Co", score: 91, value: 210, color: "#f6a500" },
    { label: "RetailMax", score: 78, value: 55, color: "#079a35" },
    { label: "MedSupply", score: 96, value: 75, color: "#7400e8" },
];

const slaPerformance = [
    { label: "Next Day", score: 88, value: "145 pkgs", color: "#7400e8" },
    { label: "2-Day", score: 93, value: "280 pkgs", color: "#079a35" },
    { label: "Ground", score: 96, value: "420 pkgs", color: "#f6a500" },
    { label: "Economy", score: 91, value: "180 pkgs", color: "#7400e8" },
];

const atRiskOrders = [
    {
        tracking: "12999AA10123",
        carrier: "UPS",
        client: "Acme Corp",
        sla: "Next Day",
        route: "Los Angeles, CA → New York, NY",
        status: "Due Today",
        badge: "bg-red-50 text-red-600",
    },
    {
        tracking: "948011189922",
        carrier: "USPS",
        client: "GlobalTrade",
        sla: "2-Day",
        route: "Chicago, IL → Miami, FL",
        status: "1d",
        badge: "bg-amber-50 text-amber-700",
    },
    {
        tracking: "612999889280",
        carrier: "FedEx",
        client: "RetailMax",
        sla: "Next Day",
        route: "Dallas, TX → Seattle, WA",
        status: "Due Today",
        badge: "bg-red-50 text-red-600",
    },
];

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="rounded-3xl border border-[#3f2d5f] bg-[#110923] p-4 text-sm text-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="mb-2 text-sm font-semibold text-white">{label}</div>
            {payload.map((item) => (
                <div key={item.dataKey} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        {item.name}
                    </span>
                    <span className="font-semibold text-white">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

function FilterChip({ icon, label }) {
    return (
        <button className="flex items-center gap-2 rounded-full border border-[#e7e2f1] bg-white/80 px-4 py-2 text-xs font-medium text-[#5f5876] transition hover:border-[#7b00f5] hover:text-[#090514]">
            {icon && <IconAsset name={icon} className="h-3.5 w-3.5" />}
            {label}
        </button>
    );
}

function MetricTile({ item }) {
    return (
        <div className="rounded-3xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.color}`}>
                    <IconAsset name={item.icon} className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-950">{item.value}</p>
        </div>
    );
}

function ProgressBarItem({ item }) {
    return (
        <div className="space-y-2 rounded-3xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                </div>
                <span className="text-sm font-semibold text-slate-600">{item.score}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
            </div>
            <p className="text-xs text-slate-500">{item.value}</p>
        </div>
    );
}

function AtRiskOrdersTable() {
    return (
        <div className="overflow-hidden rounded-3xl border border-[#ece8f2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8f2] px-6 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-950">At-Risk Orders</h2>
                    <p className="mt-1 text-sm text-slate-500">Orders needing immediate attention and follow-up.</p>
                </div>
                <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{atRiskOrders.length} orders</div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-600">
                    <thead className="bg-[#faf8ff] text-xs uppercase tracking-[0.18em] text-[#7d708e]">
                        <tr>
                            <th className="px-6 py-4">Tracking #</th>
                            <th className="px-6 py-4">Carrier</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">SLA</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Days Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        {atRiskOrders.map((order) => (
                            <tr key={order.tracking} className="border-t border-[#ece8f2] hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-950">{order.tracking}</td>
                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{order.carrier}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{order.client}</td>
                                <td className="px-6 py-4 text-slate-700">{order.sla}</td>
                                <td className="px-6 py-4 text-slate-600">{order.route}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.badge}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function SlaKpiPage() {
    return (
        <section className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-7 xl:px-9">
            <div className="mx-auto">
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-950">SLA & KPI Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                            On-time performance, at-risk orders, and carrier SLA compliance across your freight network.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="inline-flex items-center gap-2 rounded-full border border-[#e7e2f1] bg-white px-4 py-2 text-xs font-semibold text-[#5f5876] transition hover:border-[#7b00f5] hover:text-[#090514]">
                            <IconAsset name="calendar" className="h-3.5 w-3.5" />
                            Last 30 day
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-[#e7e2f1] bg-white px-4 py-2 text-xs font-semibold text-[#5f5876] transition hover:border-[#7b00f5] hover:text-[#090514]">
                            All Carriers
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-[#e7e2f1] bg-white px-4 py-2 text-xs font-semibold text-[#5f5876] transition hover:border-[#7b00f5] hover:text-[#090514]">
                            All Clients
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-[#e7e2f1] bg-white px-4 py-2 text-xs font-semibold text-[#5f5876] transition hover:border-[#7b00f5] hover:text-[#090514]">
                            All Warehouse
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <MetricTile key={metric.title} item={metric} />
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="rounded-3xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">Weekly Delivery Trend</h2>
                                <p className="mt-1 text-sm text-slate-500">Track on-time, late and at-risk volumes across the last six weeks.</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                On-Time
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                Late
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                                At-Risk
                            </div>
                        </div>
                        <div className="mt-6 h-85">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyTrendData} margin={{ top: 12, right: 18, left: -16, bottom: 0 }}>
                                    <CartesianGrid stroke="#ece8f2" strokeDasharray="3 4" vertical={false} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 12 }} />
                                    <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                                    <Bar dataKey="atRisk" stackId="a" fill="#f6a500" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="late" stackId="a" fill="#ff3b4f" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="onTime" stackId="a" fill="#079a35" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-[#1e1631] bg-[#100f26] p-6 shadow-[0_24px_50px_rgba(17,9,35,0.18)] text-white">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.32em] text-[#a386d0]">AI Executive Summary</p>
                                <h2 className="mt-3 text-xl font-semibold">SLA performance insights</h2>
                            </div>
                            <div className="h-12 w-12 rounded-3xl bg-white/10" />
                        </div>
                        <p className="text-sm leading-6 text-[#c9bfd9]">
                            Generate an AI-powered executive summary of your SLA performance with actionable recommendations.
                        </p>
                        <button className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#12061f] transition hover:bg-[#f3e9ff]">
                            Generate Summary
                        </button>
                    </section>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="rounded-3xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">Performance by Client</h2>
                                <p className="mt-1 text-sm text-slate-500">Delivery success and volume for your top clients.</p>
                            </div>
                            <span className="rounded-full bg-[#f3e8ff] px-3 py-1 text-xs font-semibold text-[#7b00f5]">Top clients</span>
                        </div>
                        <div className="space-y-4">
                            {clientPerformance.map((item) => (
                                <ProgressBarItem key={item.label} item={item} />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                        <div className="mb-6">
                            <h2 className="text-base font-semibold text-slate-950">Performance by SLA Type</h2>
                            <p className="mt-1 text-sm text-slate-500">Compare SLA fulfillment rates across service types.</p>
                        </div>
                        <div className="space-y-4">
                            {slaPerformance.map((item) => (
                                <ProgressBarItem key={item.label} item={item} />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-6">
                    <AtRiskOrdersTable />
                </div>
            </div>
        </section>
    );
}
