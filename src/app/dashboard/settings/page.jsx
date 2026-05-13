import React from "react";
import {
  Calculator,
  Package,
  ChevronDown,
  User,
  Globe,
  Settings,
  Shield,
  Building2,
  CircleCheck,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const features = [
  {
    title: "AI Discrepancy Explanations",
    description: "LLM-generated explanations for billing discrepancies",
  },
  {
    title: "KPI Executive Summaries",
    description: "AI-generated summaries of KPI performance",
  },
  {
    title: "At-Risk Order Classification",
    description: "AI classification of at-risk shipments",
  },
  {
    title: "Claim Priority Scoring",
    description: "AI prioritization of open claims",
  },
];

const platformInfo = [
  { label: "Module", value: "Courier Conciliation" },
  { label: "Version", value: "1.0.0" },
  { label: "Supported Carriers", value: "USPS, FedEx, UPS, GoFo, DHL" },
  { label: "AI Engine", value: "SynC AI (LLM)" },
  { label: "Export Formats", value: "CSV, Excel, PDF" },
];

export default function RateCalculatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Settings</h1>
            <p>Manage your account, integrations, and platform preferences.</p>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-3 gap-2">
            <TabsTrigger value="profile"><User /> Profile</TabsTrigger>
            <TabsTrigger value="integrations"><Globe /> Integrations</TabsTrigger>
            <TabsTrigger value="platform"><Settings /> Platform</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">

            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-sm mt-5">

              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <User />

                <h2 className="text-xl font-semibold text-gray-900">
                  Account Profile
                </h2>
              </div>

              {/* Profile Card */}
              <div className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl">
                  A
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Ayan Mukherjee
                  </h3>

                  <p className="text-gray-500 text-sm font-semibold">
                    ayan.m@technoexponent.com
                  </p>

                  <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-semibold">
                    User
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <Label className="block text-sm font-medium text-gray-800 mb-2">
                    Name
                  </Label>

                  <Input
                    type="text"
                    value="Ayan Mukherjee"
                    readOnly
                    className="w-full"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="block text-sm font-medium text-gray-800 mb-2">
                    Email
                  </Label>

                  <Input
                    type="email"
                    value="ayan.m@technoexponent.com"
                    readOnly
                    className="w-full"
                  />
                </div>

                {/* Login Method */}
                <div>
                  <Label className="block text-sm font-medium text-gray-800 mb-2">
                    Login Method
                  </Label>

                  <Input
                    type="text"
                    value="Google"
                    readOnly
                    className="w-full"
                  />
                </div>
              </div>

              {/* Footer Text */}
              <p className="mt-5 text-sm text-gray-500">
                Profile information is managed through your Manus account. To update,
                visit your account settings.
              </p>
            </div>

          </TabsContent>
          <TabsContent value="integrations">

            <div className="space-y-5 mt-5">
              {/* Carrier API Connections */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  {/* Globe Icon */}
                  <Globe size={20} />

                  <h2 className="text-lg font-semibold text-black">
                    Carrier API Connections
                  </h2>
                </div>

                <p className="mt-3 text-[15px] text-gray-500 font-semibold">
                  Manage your carrier API credentials from the Carriers page.
                  Connections configured there will appear here.
                </p>

                {/* USPS Card */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-gray-300" />

                      <div>
                        <h3 className="text-md text-black font-bold">USPS</h3>

                        <p className="text-xs text-gray-500 font-semibold">
                          USPS · disconnected
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-gray-500">
                      Inactive
                    </span>
                  </div>
                </div>
              </div>

              {/* Contract Reference */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  {/* Shield Icon */}
                  <Shield size={20} />

                  <h2 className="text-lg font-semibold text-black">
                    Contract Reference
                  </h2>
                </div>

                {/* Contract Card */}
                <div className="mt-10 rounded-2xl bg-gray-50 p-6">
                  <div className="flex items-start gap-3">
                    {/* Document Icon */}
                    <Building2 size={20} />

                    <div>
                      <h3 className="text-md font-bold text-black">
                        SynC AI Platform
                      </h3>

                      <div className="mt-2 space-y-2 text-xs text-gray-600 font-semibold">
                        <p>
                          Platform:{" "}
                          <span className="text-gray-700">
                            www.SynCaiPlatform.com
                          </span>
                        </p>

                        <p>
                          Fulfillment:{" "}
                          <span className="text-gray-700">
                            www.SyncFulfillment.com
                          </span>
                        </p>

                        <p>
                          DocuSign Envelope:{" "}
                          <span className="text-gray-700">
                            619A7447-54D0-499B-91E2-0DF49A3E0E7E
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </TabsContent>
          <TabsContent value="platform">

            <div className="mt-5">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* AI Features Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="mb-8 text-xl font-semibold text-black">
                    AI Features
                  </h2>

                  <div className="space-y-7">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-4"
                      >
                        <div>
                          <h3 className="text-md font-bold text-black">
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 font-semibold">
                            {feature.description}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                          Enabled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Info Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="mb-8 text-xl font-semibold text-black">
                    Platform Info
                  </h2>

                  <div className="space-y-5">
                    {platformInfo.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-6"
                      >
                        <span className="text-md text-gray-500 font-bold">{item.label}</span>

                        <span className="text-right text-md font-semibold text-black">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                      <CircleCheck size={18} className="text-green-500" />

                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}