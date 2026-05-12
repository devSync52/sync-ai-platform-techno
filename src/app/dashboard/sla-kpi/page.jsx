"use client";

import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select'
import { Button } from "@/components/ui/button";

import { Bot, Car, CircleCheck, CircleX, Clock, Download, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const weeklyTrendData = [
    { week: "W1", onTime: 170, late: 16, atRisk: 9 },
    { week: "W2", onTime: 162, late: 20, atRisk: 10 },
    { week: "W3", onTime: 174, late: 14, atRisk: 11 },
    { week: "W4", onTime: 169, late: 19, atRisk: 12 },
    { week: "W5", onTime: 182, late: 15, atRisk: 8 },
    { week: "W6", onTime: 188, late: 13, atRisk: 7 },
];

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


export default function SlaKpiPage() {


    return (
        <div className="p-6 space-y-6 overflow-auto">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2 mb-4">
                    <h1 className="text-2xl font-bold text-primary">SLA & KPI Dashboard</h1>
                    <p>On-time performance, at-risk orders, and carrier SLA compliance.</p>
                </div>
            </div>

            <Card className="p-4 bg-white">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Last 30 days" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectItem value="30day" defaultChecked>Last 30 days</SelectItem>
                                <SelectItem value="7day">Last 7 days</SelectItem>
                                <SelectItem value="90day">Last 90 days</SelectItem>
                                <SelectItem value="year">Year to date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Carriers" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectItem value="all" defaultChecked>All carriers</SelectItem>
                                <SelectItem value="usps">USPS</SelectItem>
                                <SelectItem value="fedex">FedEx</SelectItem>
                                <SelectItem value="ups">UPS</SelectItem>
                                <SelectItem value="gofo">Gofo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectItem value="allclients" defaultChecked>All Clients</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select className="w-full">
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Warehouses" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                <SelectItem value="allwarehouses" defaultChecked>All Warehouses</SelectItem>
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
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Total  */}

                <div className="bg-white rounded-2xl border border-gray-200 p-5 min-h-42.5">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-[20px] text-black font-medium">Total</span>
                            <p className=" text-[16px] text-[#5E6B8A]">
                                Shipments tracked
                            </p>
                        </div>
                        <div className="w-15 h-15 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Car size={30} color="#155dfc" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-black leading-none">0</h2>
                </div>

                {/* On-Time */}

                <div className="bg-white rounded-2xl border border-gray-200 p-5 min-h-42.5">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-[20px] text-black font-medium">On-Time</span>
                            <p className="text-[16px] text-[#5E6B8A]">
                                0 deliveries
                            </p>
                        </div>
                        <div className="w-15 h-15 rounded-xl bg-green-100 flex items-center justify-center">
                            <CircleCheck size={30} color="#047c3b" />
                        </div>

                    </div>

                    <h2 className="text-4xl font-bold text-green-600 leading-none">0%</h2>

                </div>

                {/* Late */}

                <div className="bg-white rounded-2xl border border-gray-200 p-5 min-h-42.5">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-[20px] text-black font-medium">Late</span>
                            <p className="text-[16px] text-[#5E6B8A]">
                                0 deliveries
                            </p>
                        </div>
                        <div className="w-15 h-15 rounded-xl bg-red-100 flex items-center justify-center">
                            <CircleX size={30} color="#dc2626" />
                        </div>

                    </div>

                    <h2 className="text-4xl font-bold text-red-500 leading-none">0%</h2>

                </div>

                {/* At-Risk */}

                <div className="bg-white rounded-2xl border border-gray-200 p-5 min-h-42.5">
                    <div className="flex items-center gap-3 mb-5 justify-between">
                        <div>
                            <span className="text-[20px] text-black font-medium">At-Risk</span>
                            <p className="text-[16px] text-[#5E6B8A]">
                                Orders at risk
                            </p>
                        </div>
                        <div className="w-15 h-15 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Clock size={30} color="#ea580c" />
                        </div>

                    </div>

                    <h2 className="text-4xl font-bold text-orange-500 leading-none">0</h2>


                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 min-h-50">
                    <h2 className="text-black font-semibold text-xl">
                        Weekly Delivery Trend
                    </h2>

                    <div className="mt-6 h-85">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyTrendData} margin={{ top: 12, right: 18, left: -16, bottom: 0 }}>
                                <CartesianGrid stroke="#ece8f2" strokeDasharray="3 4" vertical={false} />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7d708e", fontSize: 12 }} />
                                <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                                <Bar dataKey="onTime" stackId="a" fill="#079a35" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="late" stackId="a" fill="#ff3b4f" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="atRisk" stackId="a" fill="#f6a500" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        On Time
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                        Late
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                        At Risk
                    </div>
                </div>

                {/* Right Card */}
                <div className="bg-[#13002f] rounded-2xl p-6 flex flex-col justify-between min-h-50">

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
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by Client
                    </h2>

                    {clientData.map((item, index) => (
                        <ProgressRow key={index} item={item} />
                    ))}
                </div>

                {/* Right Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-8">
                        Performance by SLA Type
                    </h2>

                    {slaData.map((item, index) => (
                        <ProgressRow key={index} item={item} />
                    ))}
                </div>
            </div>

            <Card className="p-4 bg-white">
                <div className="mb-3 text-lg font-medium">At-Risk Orders</div>
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
                            <tr className="border-b last:border-0">
                                <td className="py-2 pr-3 font-medium">1Z999AA10123…</td>
                                <td className="py-2 pr-3">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-700/10">
                                        UPS
                                    </span>
                                </td>
                                <td className="py-2 pr-3">Acme Corp</td>
                                <td className="py-2 pr-3">Next Day</td>
                                <td className="py-2 pr-3">Los Angeles, CA → New York, NY</td>
                                <td className="py-2 pr-3">
                                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 inset-ring inset-ring-red-600/10">
                                        Due Today
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
