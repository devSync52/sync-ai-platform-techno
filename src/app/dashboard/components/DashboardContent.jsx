"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import IconAsset from "@/components/IconAsset";
import AiKpiSummary from "./AiKpiSummary";
import MetricCard from "./MetricCard";
import { metrics as staticMetrics } from "./data";
import { FetchSlaDashboardAction, SLA_AT_RISK_LIMIT, defaultSlaMetrics, normalizeSlaDashboard } from "@/services/actions/orders";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { PROJECT_URL } from "@/utils/constants";

const PerformanceChart = dynamic(() => import("./PerformanceChart"), { ssr: false });
const DiscrepancyDonut = dynamic(() => import("./DiscrepancyDonut"), { ssr: false });
const CarrierOnTimeChart = dynamic(() => import("./CarrierOnTimeChart"), { ssr: false });

const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(amount || 0));
};

export default function DashboardContent({ initialSlaDashboard = null, initialCounts = null, initialDiscrepancyTypes = [], initialCarrierOnTimeRate = [] }) {
    const dispatch = useDispatch();
    const { slaDashboard } = useSelector((state) => state.orders);
    const serverSlaDashboard = useMemo(() => initialSlaDashboard ? normalizeSlaDashboard(initialSlaDashboard) : null, [initialSlaDashboard]);
    const hasClientDashboardData = Boolean(
        slaDashboard?.deliveryTrend?.length ||
        slaDashboard?.atRiskOrders?.length ||
        slaDashboard?.performance?.length ||
        slaDashboard?.metrics?.total?.value
    );
    const dashboardData = hasClientDashboardData ? slaDashboard : serverSlaDashboard;
    const slaMetrics = useMemo(() => ({
        ...defaultSlaMetrics,
        ...(dashboardData?.metrics || {}),
    }), [dashboardData?.metrics]);
    const deliveryTrend = useMemo(() => dashboardData?.deliveryTrend || [], [dashboardData?.deliveryTrend]);

    useEffect(() => {
        dispatch(FetchSlaDashboardAction({ page: 1, limit: SLA_AT_RISK_LIMIT })).catch(() => { });
    }, [dispatch]);

    const dashboardMetrics = useMemo(() => {
        const totalShipments = initialCounts?.totalShipments ?? slaMetrics.total?.value ?? 0;
        const percentageOfShipments = (count) => totalShipments > 0 ? Math.round((Number(count || 0) / totalShipments) * 100) : 0;

        const liveMetrics = [
            {
                label: "Total Shipments",
                value: `${totalShipments}`,
                badge: "Total",
                color: "blue",
                icon: "truck",
            },
            {
                label: "On-Time Deliveries",
                value: `${initialCounts?.onTimeDeliveries ?? slaMetrics.onTime?.value ?? 0}`,
                badge: `${percentageOfShipments(initialCounts?.onTimeDeliveries ?? slaMetrics.onTime?.value ?? 0)}%`,
                color: "green",
                icon: "check",
            },
            {
                label: "Late Deliveries",
                value: `${initialCounts?.lateDeliveries ?? slaMetrics.late?.value ?? 0}`,
                badge: `${percentageOfShipments(initialCounts?.lateDeliveries ?? slaMetrics.late?.value ?? 0)}%`,
                color: "red",
                icon: "close",
            },
            {
                label: "At-Risk Orders",
                value: `${initialCounts?.atRiskOrders ?? slaMetrics.atRisk?.value ?? 0}`,
                badge: `${percentageOfShipments(initialCounts?.atRiskOrders ?? slaMetrics.atRisk?.value ?? 0)}%`,
                color: "amber",
                icon: "clock",
            },
        ];

        const financeMetrics = [
            {
                ...staticMetrics[4],
                value: formatMoney(initialCounts?.creditBalance),
            },
            {
                ...staticMetrics[5],
                value: `${initialCounts?.openClaims ?? 0}`,
            },
            {
                ...staticMetrics[6],
                value: `${initialCounts?.processedInvoices ?? 0}`,
            },
            {
                ...staticMetrics[7],
                value: formatMoney(initialCounts?.totalVariance),
            },
        ];

        return [...liveMetrics, ...financeMetrics];
    }, [slaMetrics, initialCounts]);

    const performanceData = useMemo(() => (
        deliveryTrend.map((item) => ({
            day: item.day || item.week,
            onTime: item.onTime || 0,
            late: item.late || 0,
            atRisk: item.atRisk || 0,
        }))
    ), [deliveryTrend]);

    return (
        <section className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-7 xl:px-9">
            <div className="mx-auto">
                <header className="motion-fade-up mb-7 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[24px] font-bold leading-7 tracking-normal text-[#090514]">
                            Welcome back, Soumallya
                        </h1>
                        <p className="mt-1 text-sm text-[#68607f]">
                            Here&apos;s your freight operations overview for today.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={PROJECT_URL.DASHBOARD_LABEL_GENERATOR} className="flex h-9 items-center gap-2 rounded-md bg-[#7900e8] px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#6500c4] hover:shadow-lg hover:shadow-violet-700/20">
                            <IconAsset name="plusTag" className="h-4 w-4" />
                            New Label
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {
                        dashboardMetrics.map((metric, index) => (
                            <MetricCard key={metric.label} metric={metric} index={index} />
                        ))
                    }
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <DashboardPanel title="Delivery Performance" action="View KPI">
                        <PerformanceChart data={performanceData} />
                    </DashboardPanel>

                    <DashboardPanel title="Discrepancy Types" action="View">
                        <DiscrepancyDonut data={initialDiscrepancyTypes} />
                    </DashboardPanel>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <DashboardPanel title="Carrier On-Time Rate" action="Manage">
                        <CarrierOnTimeChart data={initialCarrierOnTimeRate} />
                    </DashboardPanel>
                    <AiKpiSummary />
                </div>
            </div>
        </section>
    );
}

function DashboardPanel({ title, action, children }) {
    return (
        <section className="interactive-card motion-scale-in rounded-xl border border-[#ece8f2] bg-white/95 p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-semibold">{title}</h2>
                <Link className="flex items-center gap-2 text-xs font-medium text-[#5f5876] transition hover:text-[#6700e7]" href="#">
                    {action}
                    <IconAsset name="arrowRight" className="h-4 w-4" />
                </Link>
            </div>
            {children}
        </section>
    );
}
