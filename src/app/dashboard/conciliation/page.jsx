import React from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function ConciliationPage() {
  const stats = [
    {
      title: "Total Invoices",
      value: "0",
      color: "text-slate-900",
    },
    {
      title: "Processed",
      value: "0",
      color: "text-green-600",
    },
    {
      title: "Total Variance",
      value: "$0.00",
      color: "text-green-600",
    },
    {
      title: "Pending Review",
      value: "0",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-primary">Freight Conciliation</h1>
        <p>Upload Veryk invoices and rate cards to automatically detect billing discrepancies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-md text-slate-500 font-semibold">{item.title}</p>

            <h2 className={`mt-2 text-4xl font-bold ${item.color}`}>
              {item.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Contracted Rate Cards */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-violet-600" />

            <h2 className="text-lg font-semibold text-slate-900">
              Contracted Rate Cards
            </h2>
          </div>

          <Button variant="outline">
            <Upload className="h-4 w-4" />
            Upload Rate Card (XLSX)
          </Button>
        </div>

        {/* Upload Box */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
            <FileSpreadsheet className="h-7 w-7 text-violet-600" />
          </div>

          <h3 className="text-sm font-semibold text-slate-700">
            Drop Veryk rate card XLSX here or click to browse
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            Supports Veryk/FedEx Cost_Veryk_*.xlsx — all service levels parsed
            automatically
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          No rate cards uploaded yet. Upload a Veryk rate card to enable real
          conciliation analysis.
        </p>
      </div>

      {/* Upload Invoice */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-violet-600" />

            <h2 className="text-lg font-semibold text-slate-900">
              Upload Invoice for Conciliation
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Select */}
            <div className="relative">
              <Select className="w-full">
                  <SelectTrigger className="w-full py-4">
                    <SelectValue placeholder="All Service Level" />
                  </SelectTrigger>
                  <SelectContent className="w-full ">
                    <SelectGroup className="w-full">
                      <SelectItem value="allcarriers" defaultChecked>All Carriers</SelectItem>
                      <SelectItem value="veryk">Veryk</SelectItem>
                      <SelectItem value="fedEx">FedEx</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
            </div>

            {/* Browse Button */}
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              Browse Files
            </Button>
          </div>
        </div>

        {/* Drop Area */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Upload className="h-8 w-8 text-violet-600" />
          </div>

          <h3 className="text-sm font-semibold text-slate-700">
            Drop invoice files here or click to browse
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            Supports CSV, PDF, and XLSX (Veryk report-veryk-*.xlsx)
          </p>
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Invoice History
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Carrier Select */}
            <div className="relative">
              <Select className="w-full">
                  <SelectTrigger className="w-full py-4">
                    <SelectValue placeholder="All Service Level" />
                  </SelectTrigger>
                  <SelectContent className="w-full ">
                    <SelectGroup className="w-full">
                      <SelectItem value="allcarriers" defaultChecked>All Carriers</SelectItem>
                      <SelectItem value="veryk">Veryk</SelectItem>
                      <SelectItem value="fedEx">FedEx</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
            </div>

            {/* Date Inputs */}
            <Input
              type="date"
              className="py-4 h-8 rounded-lg border border-slate-300 px-4 text-sm text-slate-700 outline-none"
            />

            <Input
              type="date"
              className="py-4 h-8 rounded-lg border border-slate-300 px-4 text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <FileText className="h-8 w-8 text-violet-600" />
          </div>

          <p className="text-sm font-medium text-slate-600">
            No invoices uploaded yet
          </p>
        </div>
      </div>
    </div>
  );
}