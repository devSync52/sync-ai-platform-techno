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

export default function DiscrepancyClaimPopup({ open, discrepancy, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),760px)]! gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-purple-50/60 px-6 py-5">
          <DialogTitle className="text-lg">Create claim from discrepancy</DialogTitle>
          <DialogDescription>
            Convert the selected variance into a carrier claim with the discrepancy context attached.
          </DialogDescription>
        </DialogHeader>

        {discrepancy && (
          <div className="mx-6 mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm">
            <div className="font-semibold text-orange-800">{discrepancy.id} - {discrepancy.type}</div>
            <div className="mt-1 text-orange-700">
              {discrepancy.carrier} tracking {discrepancy.tracking} with variance {discrepancy.amount}
            </div>
          </div>
        )}

        <div className="grid max-h-[64vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <FormField label="Claim type">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={discrepancy?.type || "Select claim type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overcharge">Overcharge</SelectItem>
                <SelectItem value="service-failure">Service failure</SelectItem>
                <SelectItem value="rate-mismatch">Rate mismatch</SelectItem>
                <SelectItem value="surcharge-error">Surcharge error</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Priority">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={discrepancy?.severity || "Select priority"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Carrier">
            <Input defaultValue={discrepancy?.carrier || ""} placeholder="Carrier" className="bg-white py-2" />
          </FormField>

          <FormField label="Tracking number">
            <Input defaultValue={discrepancy?.tracking || ""} placeholder="Tracking number" className="bg-white py-2" />
          </FormField>

          <FormField label="Claim amount">
            <Input defaultValue={discrepancy?.amount?.replace("$", "") || ""} type="number" placeholder="0.00" className="bg-white py-2" />
          </FormField>

          <FormField label="Linked discrepancy">
            <Input defaultValue={discrepancy?.id || ""} placeholder="Discrepancy ID" className="bg-white py-2" />
          </FormField>

          <div className="space-y-2 md:col-span-2">
            <Label>Claim notes</Label>
            <textarea
              rows={4}
              defaultValue={discrepancy ? `Claim created from ${discrepancy.id} for ${discrepancy.amount} ${discrepancy.type.toLowerCase()} variance.` : ""}
              placeholder="Add notes for the carrier claim."
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
            Create Claim
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
