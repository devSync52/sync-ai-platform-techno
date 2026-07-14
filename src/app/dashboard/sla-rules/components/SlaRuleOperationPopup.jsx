"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
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
import { CalendarClock, Clock, Loader2, Plus, ShieldCheck, Truck } from "lucide-react";
import { createSlaRule, updateSlaRule } from "@/services/actions/sla-rules";

const emptyForm = {
  carrierId: "all",
  serviceId: "all",
  commitmentDays: "3",
  riskDays: "3",
  priority: "medium",
  status: "active",
  notes: "",
};

const getInitialForm = (rule) => rule ? {
  carrierId: rule.carrierId || "all",
  serviceId: rule.serviceId || "all",
  commitmentDays: String(rule.commitmentDays ?? 3),
  riskDays: String(rule.riskDays ?? 3),
  priority: rule.priority || "medium",
  status: rule.status || "active",
  notes: rule.notes || "",
} : emptyForm;

export default function SlaRuleOperationPopup({ carriers = [], open, onOpenChange, onSaved, rule }) {
  const [form, setForm] = useState(() => getInitialForm(rule));
  const [saving, setSaving] = useState(false);
  const editing = Boolean(rule?.id);

  const services = useMemo(() => {
    if (form.carrierId && form.carrierId !== "all") {
      return carriers.find((carrier) => carrier.id === form.carrierId)?.services || [];
    }
    return carriers.flatMap((carrier) => carrier.services || []);
  }, [carriers, form.carrierId]);
  const selectedCarrierName = form.carrierId === "all"
    ? "All carriers"
    : carriers.find((carrier) => carrier.id === form.carrierId)?.name || "Select carrier";
  const selectedServiceName = form.serviceId === "all"
    ? "All services"
    : services.find((service) => service.id === form.serviceId)?.name || "Select service";
  const generatedRuleName = `${selectedCarrierName} - ${selectedServiceName}`;

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "carrierId" ? { serviceId: "all" } : {})
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: generatedRuleName,
        carrierId: form.carrierId === "all" ? null : form.carrierId,
        serviceId: form.serviceId === "all" ? null : form.serviceId,
        commitmentDays: Number(form.commitmentDays || 0),
        riskDays: Number(form.riskDays || 0),
        priority: form.priority,
        status: form.status,
        notes: form.notes,
      };

      if (editing) {
        await updateSlaRule(rule.id, payload);
        toast.success("SLA rule updated");
      } else {
        await createSlaRule(payload);
        toast.success("SLA rule created");
      }

      onSaved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save SLA rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),900px)]! gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-[0_28px_90px_rgba(25,10,50,0.24)]">
        <DialogHeader className="border-b border-purple-100 bg-[#fbf8ff] px-6 py-5">
          <div className="flex items-start gap-4 pr-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_rgba(103,0,231,0.22)]">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-950">{editing ? "Edit SLA rule" : "Create SLA rule"}</DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl">
                Define delivery commitments by carrier and service. Risk date controls when late orders become at-risk.
              </DialogDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <HeaderPill icon={Truck} label="Carrier policy" />
                <HeaderPill icon={ShieldCheck} label="Risk date" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <FormSection icon={Truck} title="Scope">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">Rule name</div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-950">{generatedRuleName}</div>
                  </div>

                  <FormField label="Carrier">
                    <Select value={form.carrierId} onValueChange={(value) => updateField("carrierId", value)}>
                      <SelectTrigger className="h-11 w-full">
                        <span className="truncate">{selectedCarrierName}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All carriers</SelectItem>
                        {carriers.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Service level">
                    <Select value={form.serviceId} onValueChange={(value) => updateField("serviceId", value)}>
                      <SelectTrigger className="h-11 w-full">
                        <span className="truncate">{selectedServiceName}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All services</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </FormSection>

              <FormSection icon={Clock} title="Commitment">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Commitment days">
                    <Input type="number" min="0" step="0.5" value={form.commitmentDays} onChange={(event) => updateField("commitmentDays", event.target.value)} className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Risk date">
                    <Input type="number" min="0" step="0.5" value={form.riskDays} onChange={(event) => updateField("riskDays", event.target.value)} className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Rule priority">
                    <Select value={form.priority} onValueChange={(value) => updateField("priority", value)}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Status">
                    <Select value={form.status} onValueChange={(value) => updateField("status", value)}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </FormSection>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Add special handling notes, exceptions, or policy context."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-slate-950">Rule behavior</div>
                <p className="mt-2 text-sm leading-6 text-[#6d607d]">
                  A shipment is late after the estimated delivery date. It becomes at-risk once it passes the configured risk date.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
                <div className="mt-3 space-y-3 text-sm">
                  <PreviewRow label="Scope" value={`${form.carrierId === "all" ? "All carriers" : "Carrier"} + ${form.serviceId === "all" ? "All services" : "Service"}`} />
                  <PreviewRow label="Commitment" value={`${form.commitmentDays || 0} days`} />
                  <PreviewRow label="Risk date" value={`${form.riskDays || 0} days`} />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 border-t border-gray-100 bg-gray-50/80 px-6">
          <DialogClose>
            <Button variant="outline" type="button" className="min-w-24">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={saving} className="min-w-36">
            {saving ? <Loader2 className="animate-spin" /> : <Plus />}
            {editing ? "Save Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HeaderPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-[#5d4a76]">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </span>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function FormField({ label, children, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
