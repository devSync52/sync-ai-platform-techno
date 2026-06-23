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
import { CalendarClock, Clock, Plus, Route, ShieldCheck, Truck } from "lucide-react";

export default function SlaRuleOperationPopup({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(calc(100vw-2rem),900px)]! gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-[0_28px_90px_rgba(25,10,50,0.24)]">
        <DialogHeader className="border-b border-purple-100 bg-[#fbf8ff] px-6 py-5">
          <div className="flex items-start gap-4 pr-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_rgba(103,0,231,0.22)]">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-950">Create SLA rule</DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl">
                Define delivery commitments by carrier, service level, zone, and client priority.
              </DialogDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <HeaderPill icon={Truck} label="Carrier policy" />
                <HeaderPill icon={Route} label="Zone window" />
                <HeaderPill icon={ShieldCheck} label="Risk threshold" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <FormSection icon={Truck} title="Scope">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Rule name" className="md:col-span-2">
                    <Input placeholder="e.g. UPS Ground - Standard" className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Carrier">
                    <Select>
                      <SelectTrigger className="h-11 w-full">
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
                      <SelectTrigger className="h-11 w-full">
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

                  <FormField label="Client segment" className="md:col-span-2">
                    <Select>
                      <SelectTrigger className="h-11 w-full">
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
                </div>
              </FormSection>

              <FormSection icon={Clock} title="Commitment">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Zone from">
                    <Input type="number" min="1" placeholder="2" className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Zone to">
                    <Input type="number" min="1" placeholder="8" className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Commitment days">
                    <Input type="number" min="1" placeholder="3" className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Warning threshold">
                    <Input type="number" min="0" placeholder="1" className="h-11 bg-white py-2" />
                  </FormField>

                  <FormField label="Rule priority" className="md:col-span-2">
                    <Select>
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
                </div>
              </FormSection>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  rows={4}
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
                  The commitment window is used to calculate the delivery due date. The warning threshold marks shipments as at-risk before breach.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">Enable rule</div>
                    <div className="mt-1 text-xs text-muted-foreground">Use this rule in SLA calculations.</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
                <div className="mt-3 space-y-3 text-sm">
                  <PreviewRow label="Scope" value="Carrier + Service" />
                  <PreviewRow label="Zone" value="2 - 8" />
                  <PreviewRow label="At-risk" value="Before breach" />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 border-t border-gray-100 bg-gray-50/80 px-6">
          <DialogClose>
            <Button variant="outline" type="button" className="min-w-24">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={() => onOpenChange(false)} className="min-w-36">
            <Plus />
            Create Rule
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
