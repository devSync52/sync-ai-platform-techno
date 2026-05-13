import React from "react";
import {
  Calculator,
  Package,
  ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function RateCalculatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] flex items-center justify-center">
            <Calculator className="w-6 h-6 text-[#a855f7]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-primary">Courier Rate Calculator</h1>
            <p>Compare rates across all carriers and uploaded rate cards</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          {/* Section Title */}
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-5 h-5 text-[#a855f7]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Package Details
            </h2>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (lbs) *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 5.5"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Length (in) *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 12"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Width (in) *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 8"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Height (in) *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 6"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>
          </div>

          {/* ZIP Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                From ZIP *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 90210"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                To ZIP *
              </Label>
              <Input
                type="text"
                placeholder="e.g. 10001"
                className="w-full py-6 px-4 rounded-xl border border-gray-300"
              />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-6">
            {/* Service Level */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Service Level
              </Label>

              <div className="relative w-full">
                <Select className="w-full">
                  <SelectTrigger className="w-full py-6">
                    <SelectValue placeholder="All Service Level" />
                  </SelectTrigger>
                  <SelectContent className="w-full ">
                    <SelectGroup className="w-full">
                      <SelectItem value="all" defaultChecked>Any (show all)</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center md:justify-start gap-5">
              <div className="scale-125 origin-left"><Switch id="residential-delivery" /></div>

              <Label htmlFor="residential-delivery" className="text-md font-semibold relative top-[-3px]">Residential delivery</Label>
            </div>
          </div>

          {/* Button */}
          <div className="mt-8">
            <button className="inline-flex items-center gap-2 bg-[#c084fc] hover:bg-[#b46cf7] text-white font-semibold px-6 h-12 rounded-xl transition">
              <Calculator className="w-4 h-4" />
              Calculate Rates
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center mt-24">
          <div className="w-20 h-20 rounded-3xl border border-[#d8b4fe] bg-[#f3e8ff] flex items-center justify-center">
            <Calculator className="w-10 h-10 text-[#c084fc]" />
          </div>

          <h3 className="mt-6 text-xl font-medium text-gray-700">
            Enter package details and ZIP codes above
          </h3>

          <p className="mt-2 text-gray-400 max-w-2xl">
            Rates will be calculated using the CarrierEngine (FedEx, UPS,
            USPS, Veryk) and any uploaded rate cards
          </p>

          {/* Carrier Dots */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              FedEx Ground & Home Delivery
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              UPS Ground
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              USPS Ground & Priority
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-500"></span>
              Veryk (FedEx HD)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}