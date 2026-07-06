"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function DiscrepancyClaimPopup({ open, discrepancy, onOpenChange, onSubmit, saving }) {
  if (!discrepancy) return null;
  return <ClaimDialog key={discrepancy.id} {...{ open, discrepancy, onOpenChange, onSubmit, saving }} />;
}

function ClaimDialog({ open, discrepancy, onOpenChange, onSubmit, saving }) {
  const [form, setForm] = useState(() => ({
      type: discrepancy.type, priority: discrepancy.severity, carrier: discrepancy.carrier,
      trackingNumber: discrepancy.trackingNumber, amount: discrepancy.variance,
      notes: `Claim created from ${discrepancy.displayId} for ${formatMoney(discrepancy.variance)} variance.`,
  }));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),760px)]! gap-0 overflow-hidden p-0">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount) }); }}>
          <DialogHeader className="border-b bg-purple-50/60 px-6 py-5">
            <DialogTitle className="text-lg">Create claim from discrepancy</DialogTitle>
            <DialogDescription>Convert the selected variance into a carrier claim with its context attached.</DialogDescription>
          </DialogHeader>
          <div className="mx-6 mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-800">
            <div className="font-semibold">{discrepancy.displayId} · {label(discrepancy.type)}</div>
            <div className="mt-1">{label(discrepancy.carrier)} tracking {discrepancy.trackingNumber} · {formatMoney(discrepancy.variance)}</div>
          </div>
          <div className="grid max-h-[64vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
            <Field label="Claim type"><Input value={form.type || ""} onChange={(e) => set("type", e.target.value)} required /></Field>
            <Field label="Priority"><Select value={form.priority || ""} onValueChange={(v) => set("priority", v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["high","medium","low"].map((v) => <SelectItem key={v} value={v}>{label(v)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Carrier"><Input value={form.carrier || ""} onChange={(e) => set("carrier", e.target.value)} required /></Field>
            <Field label="Tracking number"><Input value={form.trackingNumber || ""} onChange={(e) => set("trackingNumber", e.target.value)} required /></Field>
            <Field label="Claim amount"><Input value={form.amount ?? ""} onChange={(e) => set("amount", e.target.value)} type="number" min="0.01" step="0.01" required /></Field>
            <Field label="Linked discrepancy"><Input value={discrepancy.displayId} disabled /></Field>
            <div className="space-y-2 md:col-span-2"><Label>Claim notes</Label>
              <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={4} maxLength={2000}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500" /></div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" type="button" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}><Plus />{saving ? "Creating..." : "Create Claim"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label: text, children }) { return <div className="space-y-2"><Label>{text}</Label>{children}</div>; }
const label = (value = "") => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
