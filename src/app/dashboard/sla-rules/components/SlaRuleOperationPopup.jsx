"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

export default function SlaRuleOperationPopup({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),780px)]! gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-purple-50/60 px-6 py-5">
          <DialogTitle className="text-lg">Create SLA rule</DialogTitle>
          <DialogDescription>
            Define delivery commitments by carrier, service level, zone, and client priority.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <FormField label="Rule name">
            <Input placeholder="e.g. UPS Ground - Standard" className="bg-white py-2" />
          </FormField>

          <FormField label="Carrier">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All carriers</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="veryk">Veryk</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Service level">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="ground">Ground</SelectItem>
                <SelectItem value="home-delivery">Home Delivery</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="express">Express</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Client segment">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select client segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="priority">Priority accounts</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Zone from">
            <Input type="number" min="1" placeholder="2" className="bg-white py-2" />
          </FormField>

          <FormField label="Zone to">
            <Input type="number" min="1" placeholder="8" className="bg-white py-2" />
          </FormField>

          <FormField label="Commitment days">
            <Input type="number" min="1" placeholder="3" className="bg-white py-2" />
          </FormField>

          <FormField label="Warning threshold">
            <Input type="number" min="0" placeholder="1 day before breach" className="bg-white py-2" />
          </FormField>

          <FormField label="Rule priority">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">Enable rule</div>
              <div className="mt-1 text-xs text-muted-foreground">Use this rule in SLA calculations.</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <textarea
              rows={4}
              placeholder="Add special handling notes, exceptions, or policy context."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 px-6">
          <DialogClose>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={() => onOpenChange(false)}>
            <Plus />
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
