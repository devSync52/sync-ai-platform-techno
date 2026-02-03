

import { ShipEngineRate, NormalizedRate } from "@/types/database";

export interface CarrierServiceConfig {
  display_name: string;
  enabled_for_quotes: boolean;
  sort_order: number;
}

export type CarrierServiceMap = Record<string, CarrierServiceConfig>;

export function normalizeShipEngineRates(
  rates: ShipEngineRate[],
  servicesConfig: CarrierServiceMap
): NormalizedRate[] {
  const normalized = rates.map((rate) => {
    const key = `${rate.carrier_code}:${rate.service_code}`;
    const config = servicesConfig[key];

    const total =
      Number(rate.shipping_amount?.amount || 0) +
      Number(rate.other_amount?.amount || 0) +
      Number(rate.insurance_amount?.amount || 0) +
      Number(rate.confirmation_amount?.amount || 0);

    const carrierPretty =
      rate.carrier_code.toLowerCase() === "usps"
        ? "USPS"
        : rate.carrier_code.toLowerCase() === "ups"
        ? "UPS"
        : rate.carrier_code.toLowerCase() === "fedex"
        ? "FedEx"
        : rate.carrier_friendly_name || rate.carrier_code.toUpperCase();

    return {
      carrier: carrierPretty,
      carrier_code: rate.carrier_code,
      service_code: rate.service_code,
      service_name: rate.service_type,
      display_name: config?.display_name || rate.service_type,
      total,
      currency: rate.shipping_amount?.currency?.toUpperCase() || "USD",
      delivery_days:
        typeof rate.delivery_days === "number" ? rate.delivery_days : null,
      delivery_date: rate.estimated_delivery_date || null,
      zone: typeof rate.zone === "number" ? rate.zone : null,
      package_type: rate.package_type || null,
      attributes: rate.rate_attributes || [],
      source: "shipengine",
      raw: rate,
    } satisfies NormalizedRate;
  });

  const filtered = normalized.filter((n) => {
    const key = `${n.carrier_code}:${n.service_code}`;
    const config = servicesConfig[key];
    if (!config) return false;
    return config.enabled_for_quotes;
  });

  filtered.sort((a, b) => {
    const keyA = `${a.carrier_code}:${a.service_code}`;
    const keyB = `${b.carrier_code}:${b.service_code}`;
    const sortA = servicesConfig[keyA]?.sort_order ?? 999;
    const sortB = servicesConfig[keyB]?.sort_order ?? 999;

    if (sortA !== sortB) return sortA - sortB;
    return a.total - b.total;
  });

  return filtered;
}