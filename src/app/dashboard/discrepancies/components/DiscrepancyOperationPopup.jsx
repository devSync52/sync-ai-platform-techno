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
import { Plus } from "lucide-react";

export default function DiscrepancyOperationPopup({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),820px)]! gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-purple-50/60 px-6 py-5">
          <DialogTitle className="text-lg">Create discrepancy</DialogTitle>
          <DialogDescription>
            Log a billing variance so it can be reviewed, explained, and converted into a claim.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <FormField label="Carrier">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="veryk">Veryk</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Discrepancy type">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dim-weight">Dim Weight</SelectItem>
                <SelectItem value="rate-mismatch">Rate Mismatch</SelectItem>
                <SelectItem value="fuel-surcharge">Fuel Surcharge</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Tracking number">
            <Input placeholder="e.g. 1Z999..." className="bg-white py-2" />
          </FormField>

          <FormField label="Invoice ID">
            <Input placeholder="Invoice reference" className="bg-white py-2" />
          </FormField>

          <FormField label="Expected amount">
            <Input type="number" placeholder="0.00" className="bg-white py-2" />
          </FormField>

          <FormField label="Billed amount">
            <Input type="number" placeholder="0.00" className="bg-white py-2" />
          </FormField>

          <FormField label="Severity">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-2 md:col-span-2">
            <Label>Explanation</Label>
            <textarea
              rows={4}
              placeholder="Describe the variance and any supporting calculation details."
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
            Create Discrepancy
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
