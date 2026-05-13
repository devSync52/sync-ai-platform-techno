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

        <button className="flex items-center gap-2 rounded-xl bg-[#c95a00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b95000]">
          <Wallet className="h-4 w-4" />
          Top Up
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Label Generator</h1>
          <p>Generate shipping labels using your credit wallet. Each label consumes credits.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-2xl border-2 border-[#f4a400] bg-white px-5 py-3 font-semibold text-[#5b21b6] shadow-sm">
            <Wallet className="h-4 w-4" />
            $0.00 credits
            <AlertTriangle className="h-4 w-4 text-[#f4a400]" />
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-[#6d0ff2] px-5 py-3 font-semibold text-white transition hover:bg-[#5b0dd0]">
            <Plus className="h-4 w-4" />
            New Label
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-8 text-2xl font-semibold text-gray-900">
          Create Shipping Label
        </h2>

        {/* Select Row */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label className="mb-2 block text-sm font-semibold text-gray-700">
              Carrier *
            </Label>

            <div className="relative w-full">
              <Select className="w-full rounded-xl border border-gray-300 px-4 py-6 outline-none focus:border-purple-500">
                <SelectTrigger className="w-full py-6 rounded-xl border border-gray-300">
                  <SelectValue placeholder="Select a Carrier" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup className="w-full">
                    <SelectLabel>Carrier</SelectLabel>
                    <SelectItem value="feedex">FEDEX</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold text-gray-700">
              Service Type *
            </Label>

            <div className="relative w-full">
              <Select className="w-full rounded-xl border border-gray-300 px-4 py-6 outline-none focus:border-purple-500">
                <SelectTrigger className="w-full py-6 rounded-xl border border-gray-300">
                  <SelectValue placeholder="Select a Type" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup className="w-full">
                    <SelectLabel>Carrier</SelectLabel>
                    <SelectItem value="ground">Ground</SelectItem>
                    <SelectItem value="2day">2day</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sender */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#5b6b9c]">
              FROM (SENDER)
            </h3>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Name *"
                className="w-full"
              />

              <Input
                type="text"
                placeholder="Address"
                className="w-full"
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="text"
                  placeholder="City"
                  className="w-full"
                />

                <Input
                  type="text"
                  placeholder="State"
                  className="w-full"
                />

                <Input
                  type="text"
                  placeholder="ZIP"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#5b6b9c]">
              TO (RECIPIENT)
            </h3>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Name *"
                className="w-full"
              />

              <Input
                type="text"
                placeholder="Address"
                className="w-full"
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="text"
                  placeholder="City"
                  className="w-full"
                />

                <Input
                  type="text"
                  placeholder="State"
                  className="w-full"
                />

                <Input
                  type="text"
                  placeholder="ZIP"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Package */}
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#5b6b9c]">
            PACKAGE
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Weight (lbs) *
              </Label>

              <Input
                type="number"
                placeholder="0.0"
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Length (in)
              </Label>

              <Input
                type="number"
                placeholder="0.0"
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                Width (in)
              </Label>

              <Input
                type="number"
                placeholder="0.0"
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Height (in)
              </label>

              <Input
                type="number"
                placeholder="0.0"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium text-gray-700">
            Reference Number
          </Label>

          <Input
            type="text"
            placeholder="Optional reference..."
            className="w-full"
          />
        </div>

        {/* Footer Buttons */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Button variant="outline">
            Cancel
          </Button>

          <Button>
            <Tag className="h-5 w-5" />
            Generate Label
          </Button>
        </div>
      </div>

      <div className="relative bg-[#fff] border border-gray-200 rounded-2xl shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-semibold text-black">
            Generated Labels
          </h2>

          {/* Refresh Icon */}
          <Button variant="outline" size="icon">
            <RefreshCwIcon/>
          </Button>
        </div>

        {/* Empty State */}
        <div className=" flex flex-col items-center justify-center h-[355px]">
          
          {/* Icon */}
          <div className="mb-5">
            <TagIcon size={50} color="#ccc" />
          </div>

          {/* Text */}
          <p className="text-md text-[#4a4f87] font-medium">
            No labels generated yet
          </p>

          <p className="text-sm text-[#5f6699] mt-1 mb-3">
            Create your first shipping label above
          </p>

          {/* Button */}
          <Button>
            <PlusIcon/>
            New Label
          </Button>
        </div>
      </div>
    </div>
  );
}