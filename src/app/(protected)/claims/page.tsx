"use client";

import "@/styles/daypicker-custom.css";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from "@/components/ui/button";

import { Bot, Car, Check, CircleCheck, CircleX, Clock, Info, Package, Plus, RefreshCcw, ShieldAlert } from 'lucide-react';


export default function DashboardClient({ userId }: { userId: string }) {


  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-primary">Claims Management</h1>
          <p>Open, track, and resolve freight billing claims with carriers.</p>
        </div>
        <div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <Button variant="outline">
                Export XLSX
              </Button>
            </div>
            <div>
              <Button variant="outline">
                Export CSV
              </Button>
            </div>
            <div>
              <Button>
                New Claim
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Open  */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[170px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Info color="#ea580c" />
            </div>
            <span className="text-[18px] text-[#4B5A8A] font-medium">Open</span>
          </div>

          <h2 className="text-4xl font-bold text-orange-500 leading-none">0</h2>

        </div>



        {/* n Progress  */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[170px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock color="#155dfc" />
            </div>
            <span className="text-[18px] text-[#4B5A8A] font-medium">In Progress</span>
          </div>

          <h2 className="text-4xl font-bold text-black leading-none">0</h2>

        </div>

        {/* Resolved */}


        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[170px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CircleCheck color="#047c3b" />
            </div>
            <span className="text-[18px] text-[#4B5A8A] font-medium">Resolved</span>
          </div>

          <h2 className="text-4xl font-bold text-green-600 leading-none">0</h2>

        </div>

        {/* Total Value */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[170px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Package color="#dc2626" />
            </div>
            <span className="text-[18px] text-[#4B5A8A] font-medium">Total Value</span>
          </div>

          <h2 className="text-4xl font-bold text-red-500 leading-none">0</h2>


        </div>

      </div>

      <Card className="p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-medium">Claims</div>
          <div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-48">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open" defaultChecked>Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button variant="outline">
                  <RefreshCcw />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">ID </th>
                <th className="py-2 pr-3">Carrier</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Tracking</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">#1</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 inset-ring inset-ring-blue-700/10">
                    UPS
                  </span>
                </td>
                <td className="py-2 pr-3">overcharge</td>
                <td className="py-2 pr-3">500</td>
                <td className="py-2 pr-3">$100</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 inset-ring inset-ring-red-600/10">
                    Open
                  </span>
                </td>
                <td className="py-2 pr-3">5/7/2026</td>
                <td className="py-2 pr-3 w-48">
                  <div className="w-48">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open" defaultChecked>Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>


    </div>
  );
}
