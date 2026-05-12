import React from "react";
import {
  Link2,
  Pencil,
  Zap,
  PanelsLeftBottom,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const carriers = [
  {
    name: "USPS",
    subtitle: "United States Postal Service",
    icon: "US",
    color: "bg-slate-100",
    url: "https://api.usps.com/",
  },
  {
    name: "FedEx",
    subtitle: "Federal Express Corporation",
    icon: "📦",
    color: "bg-purple-100",
    url: "https://apis.fedex.com/",
  },
  {
    name: "UPS",
    subtitle: "United Parcel Service",
    icon: "⬛",
    color: "bg-stone-100",
    url: "https://onlinetools.ups.com/api/",
  },
  {
    name: "GoFo",
    subtitle: "GoFo Last-Mile Delivery",
    icon: "🚀",
    color: "bg-red-100",
    url: "https://api.gofo.com/v1/",
  },
  {
    name: "DHL",
    subtitle: "DHL Express Worldwide",
    icon: "🌍",
    color: "bg-yellow-100",
    url: "https://api-eu.dhl.com/",
  },
  {
    name: "Amazon Logistics",
    subtitle: "Amazon Logistics Network",
    icon: "📬",
    color: "bg-orange-100",
    url: "https://sellingpartnerapi-na.amazon.com/",
  },
];

export default function CarrierPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Carrier Integrations Hub</h1>
          <p>Manage API credentials and connection status for all your freight
            carriers.</p>
        </div>

        <div className="flex gap-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-violet-600">0</h2>
            <p className="text-sm text-gray-500">Connected</p>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold text-black">9</h2>
            <p className="text-sm text-gray-500">Available</p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {carriers.map((carrier, index) => (
          <div
            key={index}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            {/* Top */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-lg font-semibold shadow-sm ${carrier.color}`}>
                  {carrier.icon}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {carrier.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-semibold">
                    {carrier.subtitle}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <Switch id="airplane-mode" />
            </div>

            {/* Status */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
              <Link2 size={14} />
              Not Connected
            </div>

            {/* URL */}
            <div className="mt-5 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
              {carrier.url}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50">
                <Pencil size={16} />
                Configure
              </button>

              <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
                <Zap size={18} />
              </button>

              <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
                <PanelsLeftBottom size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}