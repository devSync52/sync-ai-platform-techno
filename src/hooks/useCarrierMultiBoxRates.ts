"use client";

import { useCallback, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import type { NormalizedRate } from "@/types/database";

export interface CarrierMultiBoxRatesInput {
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
  items: Array<{
    length?: number;
    width?: number;
    height?: number;
    weight_lbs?: number;
    quantity?: number;
  }>;
  ship_date?: string; // ISO
}

interface GetCarrierMultiBoxRatesResponse {
  success?: boolean;
  rates?: NormalizedRate[];
  error?: string;
  box?: {
    boxCount: number;
    weightPerBox: number;
    length: number;
    width: number;
    height: number;
  };
  totals?: {
    total_weight: number;
    total_volume: number;
  };
}

export function useCarrierMultiBoxRates() {
  const supabase = useSupabase();
  const [rates, setRates] = useState<NormalizedRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(
    async (input: CarrierMultiBoxRatesInput) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } =
          await supabase.functions.invoke<GetCarrierMultiBoxRatesResponse>(
            "get_carrier_multibox_rates",
            {
              body: input,
            },
          );

        if (error) {
          console.error("[useCarrierMultiBoxRates] invoke error:", error);
          setError(error.message ?? "Failed to fetch carrier rates.");
          setRates([]);
          return;
        }

        if (!data?.success) {
          console.error("[useCarrierMultiBoxRates] API returned error:", data);
          setError(data?.error ?? "Failed to fetch carrier rates.");
          setRates([]);
          return;
        }

        setRates(data.rates ?? []);
      } catch (err: any) {
        console.error("[useCarrierMultiBoxRates] Unexpected error:", err);
        setError(err?.message ?? "Unexpected error while fetching rates.");
        setRates([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return {
    rates,
    loading,
    error,
    fetchRates,
  };
}