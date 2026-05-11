"use client";

import dynamic from "next/dynamic";
import IconAsset from "@/components/IconAsset";
import AiKpiSummary from "./AiKpiSummary";
import MetricCard from "./MetricCard";
import { metrics } from "./data";

const PerformanceChart = dynamic(() => import("./PerformanceChart"), { ssr: false });
const DiscrepancyDonut = dynamic(() => import("./DiscrepancyDonut"), { ssr: false });
const CarrierOnTimeChart = dynamic(() => import("./CarrierOnTimeChart"), { ssr: false });

export default function DashboardContent() {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-7 xl:px-9">
      <div className="mx-auto">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold leading-7 tracking-normal text-[#090514]">
              Welcome back, Soumallya
            </h1>
            <p className="mt-1 text-sm text-[#68607f]">
              Here&apos;s your freight operations overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-md border border-[#d9d4e4] bg-white px-4 text-xs font-semibold text-[#090514] shadow-sm">
              <IconAsset name="invoice" className="h-4 w-4" />
              Upload Invoice
            </button>
            <button className="flex h-9 items-center gap-2 rounded-md bg-[#7900e8] px-4 text-xs font-semibold text-white shadow-sm">
              <IconAsset name="plusTag" className="h-4 w-4" />
              New Label
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {
            metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))
          }
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardPanel title="Delivery Performance (7 Days)" action="View KPI">
            <PerformanceChart />
          </DashboardPanel>

          <DashboardPanel title="Discrepancy Types" action="View">
            <DiscrepancyDonut />
          </DashboardPanel>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardPanel title="Carrier On-Time Rate" action="Manage">
            <CarrierOnTimeChart />
          </DashboardPanel>
          <AiKpiSummary />
        </div>
      </div>
    </section>
  );
}

function DashboardPanel({ title, action, children }) {
  return (
    <section className="rounded-xl border border-[#ece8f2] bg-white p-6 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <a className="flex items-center gap-2 text-xs font-medium text-[#5f5876]" href="#">
          {action}
          <IconAsset name="arrowRight" className="h-4 w-4" />
        </a>
      </div>
      {children}
    </section>
  );
}
