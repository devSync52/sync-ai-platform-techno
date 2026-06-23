"use client";

import { useMemo, useState } from "react";
import {
    BadgeDollarSign,
    BookOpen,
    Calculator,
    CheckCircle2,
    Info,
    PackageCheck,
    Route,
    Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const carrierRules = {
    fedex: {
        label: "FedEx / Veryk",
        accent: "text-indigo-600",
        badge: "bg-indigo-50 text-indigo-700",
        dimDivisor: "139 (domestic packages)",
        formula: "L x W x H (in3) / 139 = Dim Weight (lbs)",
        billableWeight: "Greater of actual weight vs dim weight",
        minBillable: "1 lb minimum per package",
        zones: [
            ["Zone 2", "0-150 miles from origin"],
            ["Zone 3", "151-300 miles"],
            ["Zone 4", "301-600 miles"],
            ["Zone 5", "601-1,000 miles"],
            ["Zone 6", "1,001-1,400 miles"],
            ["Zone 7", "1,401-1,800 miles"],
            ["Zone 8", "1,801+ miles"],
        ],
        surcharges: [
            ["Fuel Surcharge", "~15-22% on base rate (weekly updated)"],
            ["Residential Delivery", "$6.40 per package"],
            ["Delivery Area (DAS)", "$4.90 residential / $3.40 commercial"],
            ["Extended DAS", "$8.05 residential / $5.60 commercial"],
            ["AHS - Weight", "$38.50 (>70 lbs)"],
            ["AHS - Dimension", "$38.50 (longest side >48in or 2nd >30in)"],
            ["Oversize 1", "$97.50 (girth+length >96in, <=130in)"],
            ["Oversize 2", "$250.00 (girth+length >130in, <=165in)"],
            ["Adult Signature", "$7.55 per package"],
            ["Direct Signature", "$6.45 per package"],
        ],
        notes: [
            ["Base", "Fuel % applied to base transportation rate"],
            ["Surcharges", "Most surcharges are not subject to fuel, except AHS and oversize"],
            ["Source of Truth", "Uploaded Veryk rate card Excel file"],
        ],
    },
    ups: {
        label: "UPS",
        accent: "text-amber-600",
        badge: "bg-amber-50 text-amber-700",
        dimDivisor: "139 (domestic packages)",
        formula: "L x W x H (in3) / 139 = Dim Weight (lbs)",
        billableWeight: "Greater of actual weight vs dim weight",
        minBillable: "1 lb minimum per package",
        zones: [
            ["Zone 2", "0-150 miles from origin"],
            ["Zone 3", "151-300 miles"],
            ["Zone 4", "301-600 miles"],
            ["Zone 5", "601-1,000 miles"],
            ["Zone 6", "1,001-1,400 miles"],
            ["Zone 7", "1,401-1,800 miles"],
            ["Zone 8", "1,801+ miles"],
        ],
        surcharges: [
            ["Fuel Surcharge", "~14-20% on base rate (weekly updated)"],
            ["Residential Delivery", "$6.30 per package"],
            ["Delivery Area (DAS)", "$4.75 residential / $3.25 commercial"],
            ["Extended DAS", "$7.85 residential / $5.45 commercial"],
            ["AHS - Weight", "$37.50 (>70 lbs)"],
            ["AHS - Dimension", "$37.50 (longest side >48in or 2nd >30in)"],
            ["Large Package", "$97.50 (girth+length >130in)"],
            ["Additional Handling", "$18.00 per package (non-standard packaging)"],
        ],
        notes: [
            ["Negotiated Rate", "Per-zone negotiated rates in rate card"],
            ["Fuel", "Weekly fuel table applied to base transportation charge"],
            ["Discounts", "Surcharges may differ from list pricing by contract"],
        ],
    },
    usps: {
        label: "USPS",
        accent: "text-red-600",
        badge: "bg-red-50 text-red-700",
        dimDivisor: "166 (higher than FedEx/UPS)",
        formula: "L x W x H (in3) / 166 = Dim Weight (lbs)",
        billableWeight: "Applies to packages over 1 cubic foot",
        minBillable: "1 lb minimum per package",
        zones: [
            ["Local", "Same 3-digit ZIP prefix"],
            ["Zone 1-2", "0-300 miles"],
            ["Zone 4", "301-600 miles"],
            ["Zone 5", "601-1,000 miles"],
            ["Zone 6", "1,001-1,400 miles"],
            ["Zone 7", "1,401-1,800 miles"],
            ["Zone 8", "1,801+ miles"],
            ["Zone 9", "Alaska, Hawaii, territories"],
        ],
        surcharges: [
            ["Priority Mail", "Zone-based, dim weight applies >1 cu ft"],
            ["Priority Mail Cubic", "5 size tiers, no fuel surcharge"],
            ["Ground Advantage", "Zone-based, replaces First-Class Package"],
            ["Fuel Surcharge", "None on most USPS services"],
            ["Signature Confirmation", "$3.65 per package"],
            ["Insurance", "$2.45 for $0-$50 coverage"],
        ],
        notes: [
            ["Services", "Priority Mail, Priority Mail Express, Ground Advantage"],
            ["Cubic Pricing", "Priced by volume tiers instead of weight"],
            ["Fuel", "No weekly fuel surcharge on most USPS services"],
        ],
    },
};

const engineSteps = [
    "Parse shipment weight and dimensions from the invoice.",
    "Calculate billable weight using actual vs dimensional weight.",
    "Look up contracted rate by carrier, zone, service, and weight.",
    "Apply fuel surcharge from the carrier or rate card header.",
    "Add residential, delivery area, AHS, and oversize surcharges.",
    "Compare expected total against billed amount and flag variances over $0.50.",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
});

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getBaseRate = (carrier, zone, billableWeight) => {
    const carrierMultiplier = carrier == "ups" ? 1.06 : carrier == "usps" ? 0.82 : 1;
    const zoneRate = Math.max(toNumber(zone), 2) * 1.85;
    const weightRate = Math.max(billableWeight, 1) * (carrier == "usps" ? 1.18 : 1.42);

    return (zoneRate + weightRate + 4.75) * carrierMultiplier;
};

export default function RateIntelligencePage() {
    const [activeCarrier, setActiveCarrier] = useState("fedex");
    const [form, setForm] = useState({
        carrier: "fedex",
        weight: "12",
        zone: "5",
        length: "18",
        width: "14",
        height: "10",
        fuel: "18.5",
        residential: true,
    });
    const [calculated, setCalculated] = useState(false);

    const selectedRule = carrierRules[activeCarrier];

    const estimate = useMemo(() => {
        const carrier = form.carrier;
        const divisor = carrier == "usps" ? 166 : 139;
        const dimWeight = Math.ceil((toNumber(form.length) * toNumber(form.width) * toNumber(form.height)) / divisor);
        const billableWeight = Math.max(Math.ceil(toNumber(form.weight)), dimWeight, 1);
        const baseRate = getBaseRate(carrier, form.zone, billableWeight);
        const residential = form.residential ? (carrier == "ups" ? 6.3 : carrier == "usps" ? 0 : 6.4) : 0;
        const ahs = billableWeight > 70 || Math.max(toNumber(form.length), toNumber(form.width), toNumber(form.height)) > 48 ? (carrier == "ups" ? 37.5 : carrier == "usps" ? 0 : 38.5) : 0;
        const das = carrier == "usps" ? 0 : form.residential ? (carrier == "ups" ? 4.75 : 4.9) : 3.4;
        const fuel = carrier == "usps" ? 0 : baseRate * (toNumber(form.fuel) / 100);
        const total = baseRate + fuel + residential + das + ahs;

        return {
            dimWeight,
            billableWeight,
            baseRate,
            fuel,
            residential,
            das,
            ahs,
            total,
            divisor,
        };
    }, [form]);

    const updateForm = (key, value) => {
        setCalculated(false);
        setForm((current) => ({ ...current, [key]: value }));
        if (key == "carrier") setActiveCarrier(value);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-primary ring-1 ring-purple-100">
                        <BadgeDollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Rate Intelligence</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Carrier billing rules reference and rate estimator</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl border border-purple-100 bg-white p-2 shadow-sm">
                    {["rules", "estimator", "engine"].map((item) => (
                        <a
                            key={item}
                            href={`#${item}`}
                            className="rounded-lg px-3 py-2 text-center text-xs font-semibold capitalize text-[#4b3b64] transition hover:bg-purple-50 hover:text-primary"
                        >
                            {item}
                        </a>
                    ))}
                </div>
            </div>

            <Card id="rules" className="border-gray-200 bg-white shadow-sm">
                <CardHeader className="gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Carrier Billing Rules
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Reference guide for how each carrier calculates charges. These rules are encoded in the SynC conciliation engine to detect billing discrepancies.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(carrierRules).map(([key, carrier]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveCarrier(key)}
                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeCarrier == key ? "border-primary bg-purple-50 text-primary shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50"}`}
                            >
                                {carrier.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                            <div className="mb-4 flex items-center gap-3">
                                <Truck className={`h-5 w-5 ${selectedRule.accent}`} />
                                <div>
                                    <div className="text-base font-semibold text-slate-950">{selectedRule.label}</div>
                                    <div className="text-xs text-muted-foreground">Dimensional weight and zone logic</div>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ["Dim Divisor", selectedRule.dimDivisor],
                                    ["Formula", selectedRule.formula],
                                    ["Billable Weight", selectedRule.billableWeight],
                                    ["Min Billable", selectedRule.minBillable],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
                                        <div className="text-xs font-semibold uppercase text-[#7d708e]">{label}</div>
                                        <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <Route className="h-4 w-4 text-primary" />
                                Zone Guide
                            </div>
                            <div className="grid gap-2">
                                {selectedRule.zones.map(([label, value]) => (
                                    <div key={`${selectedRule.label}-${label}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${selectedRule.badge}`}>{label}</span>
                                        <span className="text-right text-muted-foreground">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-3 text-sm font-semibold text-slate-950">Common Surcharges</div>
                            <div className="space-y-2">
                                {selectedRule.surcharges.map(([label, value]) => (
                                    <div key={`${selectedRule.label}-${label}`} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                        <span className="text-sm font-medium text-slate-800">{label}</span>
                                        <span className="max-w-[60%] text-right text-sm text-muted-foreground">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                                <Info className="h-4 w-4 text-primary" />
                                Rule Notes
                            </div>
                            <div className="space-y-3">
                                {selectedRule.notes.map(([label, value]) => (
                                    <div key={`${selectedRule.label}-${label}`} className="rounded-lg bg-white p-3 shadow-sm">
                                        <div className="text-xs font-semibold uppercase text-primary">{label}</div>
                                        <div className="mt-1 text-sm text-slate-700">{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div id="estimator" className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="h-5 w-5 text-primary" />
                            Rate Estimator
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Enter shipment details to estimate the expected charge</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Carrier</Label>
                                <select
                                    value={form.carrier}
                                    onChange={(event) => updateForm("carrier", event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="fedex">FedEx / Veryk</option>
                                    <option value="ups">UPS</option>
                                    <option value="usps">USPS</option>
                                </select>
                            </div>
                            <Field label="Actual Weight (lbs)" value={form.weight} onChange={(value) => updateForm("weight", value)} />
                            <Field label="Zone (2-8)" value={form.zone} onChange={(value) => updateForm("zone", value)} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <Field label="Length (in)" value={form.length} onChange={(value) => updateForm("length", value)} />
                            <Field label="Width (in)" value={form.width} onChange={(value) => updateForm("width", value)} />
                            <Field label="Height (in)" value={form.height} onChange={(value) => updateForm("height", value)} />
                            <Field label="Fuel Surcharge %" value={form.fuel} onChange={(value) => updateForm("fuel", value)} disabled={form.carrier == "usps"} />
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                                <input
                                    type="checkbox"
                                    checked={form.residential}
                                    onChange={(event) => updateForm("residential", event.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary"
                                />
                                Residential delivery
                            </label>
                            <Button type="button" onClick={() => setCalculated(true)}>
                                <Calculator className="h-4 w-4" />
                                Calculate
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PackageCheck className="h-5 w-5 text-primary" />
                            Estimate Breakdown
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Step-by-step charge calculation</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Metric label="Billable Weight" value={`${estimate.billableWeight} lbs`} />
                            <Metric label="Dim Weight" value={`${estimate.dimWeight} lbs`} muted />
                        </div>

                        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 text-center">
                            <div className="text-xs font-semibold uppercase text-primary">Grand Total</div>
                            <div className="mt-1 text-3xl font-bold text-slate-950">{currencyFormatter.format(estimate.total)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{calculated ? "Calculated from current inputs" : "Preview updates as you type"}</div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-semibold text-slate-950">Charge Breakdown</div>
                            <BreakdownRow label="Base rate" value={estimate.baseRate} />
                            <BreakdownRow label="Fuel surcharge" value={estimate.fuel} />
                            <BreakdownRow label="Residential delivery" value={estimate.residential} />
                            <BreakdownRow label="Delivery area surcharge" value={estimate.das} />
                            <BreakdownRow label="AHS surcharge" value={estimate.ahs} />
                            <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-bold text-slate-950">
                                <span>Total</span>
                                <span>{currencyFormatter.format(estimate.total)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card id="engine" className="border-gray-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Engine Steps
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">How the SynC engine calculates expected charges for each shipment</p>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {engineSteps.map((step, index) => (
                            <div key={step} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">Step {index + 1}</div>
                                <p className="text-sm leading-6 text-slate-700">{step}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Field({ label, value, onChange, disabled = false }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input
                type="number"
                min="0"
                step="0.1"
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="bg-white py-2"
            />
        </div>
    );
}

function Metric({ label, value, muted = false }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-bold ${muted ? "text-slate-600" : "text-slate-950"}`}>{value}</div>
        </div>
    );
}

function BreakdownRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-slate-900">{currencyFormatter.format(value)}</span>
        </div>
    );
}
