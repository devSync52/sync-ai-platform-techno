"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const initialForm = {
  carrier: "", type: "", trackingNumber: "", invoiceId: "", expectedAmount: "",
  billedAmount: "", severity: "medium", status: "open", explanation: "",
};

export default function DiscrepancyOperationPopup({ open, onOpenChange, onSubmit, saving }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.carrier || !form.type || !form.trackingNumber || form.expectedAmount === "" || form.billedAmount === "") {
      setError("Carrier, type, tracking number, and both amounts are required.");
      return;
    }
    setError("");
    await onSubmit({ ...form, expectedAmount: Number(form.expectedAmount), billedAmount: Number(form.billedAmount) });
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),820px)]! gap-0 overflow-hidden p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b bg-purple-50/60 px-6 py-5">
            <DialogTitle className="text-lg">Create discrepancy</DialogTitle>
            <DialogDescription>Log a billing variance so it can be reviewed and converted into a claim.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-5 overflow-y-auto px-6 py-5 md:grid-cols-2">
            <SelectField label="Carrier" value={form.carrier} onChange={(v) => set("carrier", v)}
              options={[["ups","UPS"],["fedex","FedEx"],["usps","USPS"],["veryk","Veryk"]]} placeholder="Select carrier" />
            <SelectField label="Discrepancy type" value={form.type} onChange={(v) => set("type", v)}
              options={[["overcharge","Overcharge"],["dim-weight","Dim Weight"],["rate-mismatch","Rate Mismatch"],["fuel-surcharge","Fuel Surcharge"],["residential","Residential"]]} placeholder="Select type" />
            <Field label="Tracking number"><Input value={form.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} placeholder="e.g. 1Z999..." /></Field>
            <Field label="Invoice ID"><Input value={form.invoiceId} onChange={(e) => set("invoiceId", e.target.value)} placeholder="Invoice reference" /></Field>
            <Field label="Expected amount"><Input value={form.expectedAmount} onChange={(e) => set("expectedAmount", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" /></Field>
            <Field label="Billed amount"><Input value={form.billedAmount} onChange={(e) => set("billedAmount", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" /></Field>
            <SelectField label="Severity" value={form.severity} onChange={(v) => set("severity", v)} options={[["high","High"],["medium","Medium"],["low","Low"]]} />
            <SelectField label="Status" value={form.status} onChange={(v) => set("status", v)} options={[["open","Open"],["in-review","In Review"],["resolved","Resolved"]]} />
            <div className="space-y-2 md:col-span-2">
              <Label>Explanation</Label>
              <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} rows={4} maxLength={2000}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500" />
            </div>
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" type="button" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}><Plus />{saving ? "Creating..." : "Create Discrepancy"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function SelectField({ label, value, onChange, options, placeholder }) {
  return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></Field>;
}
