"use client";

// import "@/styles/daypicker-custom.css";

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

import { Bot, Car, Check, CircleCheck, CircleX, Clock, Download, Plus, RefreshCcw, ShieldAlert, SquarePen, Trash } from 'lucide-react';


export default function WarehousesPage() {


  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-primary">Warehouse Management</h1>
          <p>Manage your fulfillment centers and distribution points</p>
        </div>
        <div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <Button size="lg">
                <Plus />
                Add Warehouse
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Total Clients */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Total Warehouses</span>
          </div>

          <h2 className="text-4xl font-bold text-black leading-none">0</h2>

        </div>


        {/* Active */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Active</span>
          </div>

          <h2 className="text-4xl font-bold text-green-500 leading-none">0</h2>

        </div>

        {/* Inactive */}


        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">States Covered</span>
          </div>

          <h2 className="text-4xl font-bold text-red-500 leading-none">0</h2>

        </div>

      </div>

      <Card className="p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-medium">All Warehouses</div>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Client Code</th>
                <th className="py-2 pr-3">Client Name</th>
                <th className="py-2 pr-3">Contact Email</th>
                <th className="py-2 pr-3">Contact Name</th>
                <th className="py-2 pr-3">Notes</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">#1</td>
                <td className="py-2 pr-3">Ayan Mukherjee</td>
                <td className="py-2 pr-3">zofepejeca@mailinator.com</td>
                <td className="py-2 pr-3">ABC</td>
                <td className="py-2 pr-3">Rem obcaecati praese</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 inset-ring inset-ring-green-600/10">
                    Active
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <SquarePen />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash />
                    </Button>
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
