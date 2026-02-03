"use client";

import { useCallback, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import type { NormalizedRate } from "@/types/database";

export interface CarrierRatesInput {
  accountId?: string;
  from: {
    country_code: string;
    postal_code: string;
    city_locality: string;
    state_province: string;
  };
  to: {
    country_code: string;
    postal_code: string;
    city_locality: string;
    state_province: string;
  };
  weight: {
    value: number;
    unit: "pound" | "ounce";
  };
  dimensions: {
    unit: "inch";
    length: number;
    width: number;
    height: number;
  };
  ship_date?: string; // ISO, opcional
}

interface GetCarrierRatesResponse {
  success?: boolean;
  rates?: NormalizedRate[];
  error?: string;
}

export function useCarrierRates() {
  const supabase = useSupabase();
  const [rates, setRates] = useState<NormalizedRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(
    async (input: CarrierRatesInput) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke<GetCarrierRatesResponse>(
          "get_carrier_rates",
          {
            body: input,
          }
        );

        if (error) {
          console.error("[useCarrierRates] invoke error:", error);
          setError(error.message ?? "Failed to fetch carrier rates.");
          setRates([]);
          return;
        }

        if (!data?.success) {
          console.error("[useCarrierRates] API returned error:", data);
          setError(data?.error ?? "Failed to fetch carrier rates.");
          setRates([]);
          return;
        }

        setRates(data.rates ?? []);
      } catch (err: any) {
        console.error("[useCarrierRates] Unexpected error:", err);
        setError(err?.message ?? "Unexpected error while fetching rates.");
        setRates([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    rates,
    loading,
    error,
    fetchRates,
  };
}