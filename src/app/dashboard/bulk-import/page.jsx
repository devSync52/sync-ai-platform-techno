import React from "react";
import {
  Download,
  Info,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const requiredColumns = [
  "trackingNumber",
  "carrierCode",
  "status",
];

const optionalColumns = [
  "origin",
  "destination",
  "weight",
  "serviceLevel",
  "promisedDelivery",
  "actualDelivery",
];

export default function BulkImportPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Bulk Shipment Import</h1>
            <p>Upload a CSV file to import multiple shipments at once into the SLA & KPI dashboard.</p>
          </div>

          <Button size="lg">
            <Download size={18} />
            Download Template
          </Button>
        </div>

        {/* Instructions Card */}
        <div className="mb-6 rounded-3xl border border-[#E4E7EC] bg-[#EEF4FF] p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Info size={18} className="text-[#2457ff]" />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-[#2457ff]">
                How to use Bulk Import
              </h3>

              <ol className="space-y-2 text-[15px] leading-7 text-[#2457ff]">
                <li>
                  1. Download the template CSV above and fill in your data
                  (Excel or Google Sheets).
                </li>

                <li>
                  2. Required columns:{" "}
                  <span className="rounded bg-[#dbe5ff] px-2 py-1 font-medium">
                    trackingNumber
                  </span>
                  ,{" "}
                  <span className="rounded bg-[#dbe5ff] px-2 py-1 font-medium">
                    carrierCode
                  </span>
                  ,{" "}
                  <span className="rounded bg-[#dbe5ff] px-2 py-1 font-medium">
                    status
                  </span>
                </li>

                <li>
                  3. Valid status values:{" "}
                  <span className="font-medium">
                    pending, in_transit, delivered, exception, returned
                  </span>{" "}
                  — other values (e.g. “shipped”, “In Transit”) are auto-mapped.
                </li>

                <li>
                  4. Dates should be in{" "}
                  <span className="font-medium">YYYY-MM-DD</span> format (e.g.
                  2024-01-15). Empty dates are allowed.
                </li>

                <li>
                  5. Drop the file below or click to browse, review the preview,
                  then click Import.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="rounded-3xl border border-[#E4E7EC] bg-white p-8 shadow-sm">
          {/* Upload Area */}
          <div className="rounded-3xl border-2 border-dashed border-[#D9D6FE] bg-[#FCFCFD] px-6 py-20">
            <div className="flex flex-col items-center justify-center text-center relative">
              <input type="file" className="absolute left-0 top-0 w-full h-full opacity-0"/>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F2F4F7]">
                <FileText size={38} className="text-[#98A2B3]" />
              </div>

              <h2 className="text-lg font-semibold text-[#111827]">
                Drop your CSV file here
              </h2>

              <p className="mt-1 text-md text-[#667085] mb-4">
                or click to browse your files
              </p>

              <Button variant="outline">
                <Upload size={18} />
                Choose CSV File
              </Button>
            </div>
          </div>

          {/* Columns */}
          <div className="mt-8 rounded-2xl bg-[#F9FAFB] p-5">
            {/* Required */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#667085]">
                Required Columns
              </h4>

              <div className="flex flex-wrap gap-3">
                {requiredColumns.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#EEF2FF] px-4 py-2 text-sm font-medium text-[#6941C6]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Optional */}
            <div className="mt-8">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#667085]">
                Optional Columns
              </h4>

              <div className="flex flex-wrap gap-3">
                {optionalColumns.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-medium text-[#344054]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}