"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCarrierRates } from "@/hooks/useCarrierRates";
import type { NormalizedRate } from "@/types/database";
import { ArrowLeft } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";

interface StepSelectServiceProps {
  draftId: string;
  onBack: () => void;
  onNext?: () => void;
}

export function StepSelectService({
  draftId,
  onBack,
  onNext,
}: StepSelectServiceProps) {
  const supabase = useSupabase();
  const { rates, loading, error, fetchRates } = useCarrierRates();

  const [draft, setDraft] = useState<any>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedRate, setSelectedRate] = useState<NormalizedRate | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ==========================================================
  // STEP 1 - LOAD DRAFT FROM SUPABASE
  // ==========================================================
  useEffect(() => {
    async function loadDraft() {
      const { data, error } = await supabase
        .from("saip_quote_drafts")
        .select("*")
        .eq("id", draftId)
        .single();

      if (!error && data) {
        setDraft(data);
      }
      setLoadingDraft(false);
    }

    loadDraft();
  }, [draftId, supabase]);

  // ==========================================================
  // STEP 2 - SIMULATE RATES USING CARRIER EDGES
  // ==========================================================
  const handleSimulate = async () => {
    if (!draft?.ship_from || !draft?.ship_to || !draft?.items) {
      setValidationError("Missing shipment information. Complete previous steps.");
      return;
    }

    const totalWeight =
      draft.total_weight_lbs ??
      draft.items.reduce((sum: number, item: any) => sum + (item.weight_lbs || 0), 0);

    if (!totalWeight) {
      setValidationError("Total weight is missing.");
      return;
    }

    const dims = draft.package_dimensions || {
      length: 1,
      width: 1,
      height: 1,
    };

    setValidationError(null);

    await fetchRates({
      from: draft.ship_from,
      to: draft.ship_to,
      weight: {
        value: totalWeight,
        unit: "pound",
      },
      dimensions: {
        unit: "inch",
        length: dims.length,
        width: dims.width,
        height: dims.height,
      },
      ship_date: draft.ship_date ?? new Date().toISOString(),
    });
  };

  // ==========================================================
  // STEP 3 — SAVE SELECTED RATE IN THE DRAFT
  // ==========================================================
  const handleSaveSelectedRate = async () => {
    if (!selectedRate) {
      setValidationError("You must select a service to continue.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("saip_quote_drafts")
      .update({
        selected_rate: selectedRate,
        simulated_rates: rates, // opcional: salva tudo
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    setSaving(false);

    if (error) {
      console.error("Error saving selected rate:", error);
      setValidationError("Failed to save selected service.");
      return;
    }

    if (onNext) onNext();
  };

  const sortedRates = useMemo(() => [...rates], [rates]);

  if (loadingDraft) {
    return <p className="text-xs text-muted-foreground">Loading draft...</p>;
  }

  if (!draft) {
    return <p className="text-sm text-red-600">Draft not found.</p>;
  }

  return (
    <div className="space-y-4">
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-1"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        Back
      </button>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Shipping services</h3>
          <p className="text-xs text-muted-foreground">
            Compare USPS, UPS and FedEx rates for this shipment.
          </p>
        </div>

        <Button onClick={handleSimulate} disabled={loading}>
          {loading ? "Simulating..." : "Simulate services"}
        </Button>
      </div>

      {/* ERRORS */}
      {(error || validationError) && (
        <div className="text-xs text-red-500 border border-red-200 rounded-md px-3 py-2 bg-red-50">
          {validationError || error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && sortedRates.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          No services simulated yet. Click “Simulate services”.
        </p>
      )}

      {/* RATES LIST */}
      {sortedRates.length > 0 && (
        <div className="space-y-2">
          {sortedRates.map((rate) => {
            const isSelected =
              selectedRate?.carrier_code === rate.carrier_code &&
              selectedRate?.service_code === rate.service_code;

            return (
              <button
                key={`${rate.carrier_code}:${rate.service_code}:${rate.total}`}
                type="button"
                onClick={() => setSelectedRate(rate)}
                className={[
                  "w-full flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs sm:text-sm transition",
                  isSelected
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {rate.display_name}{" "}
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      ({rate.carrier})
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {rate.delivery_days != null
                      ? `${rate.delivery_days} business day${
                          rate.delivery_days === 1 ? "" : "s"
                        }`
                      : "Transit time not provided"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-sm">
                    {rate.currency} {rate.total.toFixed(2)}
                  </span>
                  {isSelected && (
                    <div className="mt-1 text-[10px] text-purple-600 font-medium">
                      Selected
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* CONTINUE BUTTON */}
      {sortedRates.length > 0 && (
        <div className="pt-3">
          <Button
            onClick={handleSaveSelectedRate}
            disabled={!selectedRate || saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}