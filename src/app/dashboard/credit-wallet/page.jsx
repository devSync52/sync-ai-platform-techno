import React from "react";
import {
  AlertTriangle,
  Wallet,
  Plus,
  Tag,
  ChevronDown,
  RefreshCwIcon,
  PlusIcon,
  TagIcon,
  CreditCard,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  ChartColumnDecreasing,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LabelGeneratorPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Top Alert */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-orange-300 bg-[#fff3e8] px-5 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-[15px] font-semibold text-[#a54b00]">
              Low credit balance — $0.00 remaining
            </h3>
            <p className="text-sm text-[#c06a2d]">
              Your balance is below $10. Top up your wallet to continue
              generating labels without interruption.
            </p>
          </div>
        </div>

        <Button className="flex items-center gap-2 rounded-xl bg-[#c95a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b95000]">
          <Wallet className="h-4 w-4" />
          Top Up
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Credit Wallet</h1>
          <p>Manage your credit balance, load credits, and track consumption.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Add Credits
          </Button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Available Balance */}
        <div className="rounded-2xl bg-[#c53d00] p-6 text-white">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <TriangleAlert className="text-white" />
          </div>

          <p className="text-lg font-medium">Available Balance</p>

          <h1 className="mt-5 text-5xl font-bold">$0.00</h1>

          <p className="mt-2 text-sm text-orange-100 flex gap-2 items-center">
            <TriangleAlert size={14} /> Low balance — top up recommended
          </p>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-3 font-semibold transition hover:bg-white/20">
            <Plus />
            Add Credits
          </button>
        </div>

        {/* Total Loaded */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <TrendingUp />
          </div>

          <p className="text-lg text-[#4f5d95] font-semibold">Total Loaded</p>

          <h2 className="mt-5 text-5xl font-bold text-green-600">$0.00</h2>

          <p className="mt-2 text-sm text-[#68708f]">
            All-time credits loaded
          </p>
        </div>

        {/* Total Consumed */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
            <TrendingDown />
          </div>

          <p className="text-lg text-[#4f5d95] font-semibold">Total Consumed</p>

          <h2 className="mt-5 text-5xl font-bold text-red-500">$0.00</h2>

          <p className="mt-2 text-sm text-[#68708f]">
            All-time credits consumed
          </p>
        </div>
      </div>

      {/* Credit Consumption */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <ChartColumnDecreasing />

            <h3 className="text-lg font-semibold text-black">
              Credit Consumption
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-[#efedf8] p-1">
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-medium shadow">
              Daily
            </button>

            <button className="px-5 py-2 text-sm text-[#5d6390]">
              Weekly
            </button>

            <button className="px-5 py-2 text-sm text-[#5d6390]">
              Monthly
            </button>
          </div>
        </div>

        {/* Empty Chart Area */}
        <div className="h-[120px]" />
      </div>

      {/* Transaction History */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">
            Transaction History
          </h3>

          <p className="text-sm text-[#5d6390]">
            Click any row for details
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center">

          <div className="h-[350px] flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-300 text-gray-400 mb-5">
              <CreditCard color="#ccc" />
            </div>
            <h4 className="text-md font-medium text-[#5d6390]">
              No transactions yet
            </h4>
            <p className="mt-1 text-sm text-[#7f85a3]">
              Add credits to get started
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}