"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeDollarSign, FileCheck2, PackageCheck, Plus } from "lucide-react";

export default function DiscrepancyClaimPopup({ open, discrepancy, onOpenChange, onSubmit, saving }) {
  if (!discrepancy) return null;
  return <ClaimDialog key={discrepancy.id} {...{ open, discrepancy, onOpenChange, onSubmit, saving }} />;
}

function ClaimDialog({ open, discrepancy, onOpenChange, onSubmit, saving }) {
  const [form, setForm] = useState(() => ({
    type: discrepancy.type,
    priority: discrepancy.severity,
    carrier: discrepancy.carrier,
    trackingNumber: discrepancy.trackingNumber,
    amount: discrepancy.variance,
    notes: `Claim created from ${discrepancy.displayId} for ${formatMoney(discrepancy.variance)} variance.`,
  }));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),780px)]! gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount) }); }}>
          <DialogHeader className="border-b bg-gradient-to-br from-purple-50 via-white to-orange-50 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-950">Create claim</DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Convert this billing variance into a carrier claim with all shipment context attached.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pt-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-950">{discrepancy.displayId}</span>
                    <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-primary">
                      {label(discrepancy.type)}
                    </span>
                    <span className={priorityClass(discrepancy.severity)}>
                      {label(discrepancy.severity)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <PackageCheck className="h-4 w-4 text-slate-400" />
                      {label(discrepancy.carrier)} · {discrepancy.trackingNumber}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Claim amount</div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-2xl font-bold text-red-600">
                    <BadgeDollarSign className="h-5 w-5" />
                    {formatMoney(discrepancy.variance)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid max-h-[60vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
            <Field label="Claim type">
              <Input className="h-11" value={form.type || ""} onChange={(e) => set("type", e.target.value)} required />
            </Field>
            <Field label="Priority">
              <Select value={form.priority || ""} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{["high", "medium", "low"].map((v) => <SelectItem key={v} value={v}>{label(v)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Carrier">
              <Input className="h-11" value={label(form.carrier || "")} onChange={(e) => set("carrier", e.target.value.toLowerCase())} required />
            </Field>
            <Field label="Tracking number">
              <Input className="h-11 font-mono" value={form.trackingNumber || ""} onChange={(e) => set("trackingNumber", e.target.value)} required />
            </Field>
            <Field label="Claim amount">
              <Input className="h-11" value={form.amount ?? ""} onChange={(e) => set("amount", e.target.value)} type="number" min="0.01" step="0.01" required />
            </Field>
            <Field label="Linked discrepancy">
              <Input className="h-11 bg-slate-50 font-mono text-slate-500" value={discrepancy.displayId} disabled />
            </Field>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Claim notes</Label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <DialogFooter className="m-0 border-t bg-slate-50 px-6 py-4">
            <Button variant="outline" type="button" disabled={saving} onClick={() => onOpenChange(false)} className="h-11 px-5">Cancel</Button>
            <Button type="submit" disabled={saving} className="h-11 px-5 shadow-lg shadow-primary/20">
              <Plus />{saving ? "Creating..." : "Create Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label: text, children }) {
  return <div className="space-y-2"><Label className="text-sm font-medium text-slate-700">{text}</Label>{children}</div>;
}

function priorityClass(value) {
  if (value === "high") return "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700";
  if (value === "medium") return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700";
  return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700";
}

const label = (value = "") => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
