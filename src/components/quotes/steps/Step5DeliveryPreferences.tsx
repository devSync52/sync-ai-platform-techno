'use client'

export type Step5DeliveryPreferencesProps = {
  draftId: string;
  initialPreferences?: any;
  onNext?: () => void;
  onBack?: () => void;
};

import { useEffect, useState } from 'react'
import type { QuoteDraft } from '@/types/quotes'
import { useSupabase } from '@/components/supabase-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation';
import { useCarrierMultiBoxRates } from '@/hooks/useCarrierMultiBoxRates';
import { computeMultiBoxFromItems } from '@/lib/shipping/multibox'

function dedupeServicesByCarrierAndCode(services: any[]): any[] {
  const map = new Map<string, any>();

  for (const svc of services || []) {
    const carrier = (svc.carrier || '').toUpperCase();
    const code = svc.carrier_service_code ?? svc.code ?? svc.serviceCode;
    const key = `${carrier}|${code || ''}`;

    if (!key.trim()) {
      // if we don't have a clear key, just push as-is later
      const fallbackKey = `__fallback__${map.size}`;
      if (!map.has(fallbackKey)) {
        map.set(fallbackKey, svc);
      }
      continue;
    }

    const existing = map.get(key);
    const currentTotal = Number(svc.total ?? 0);
    const existingTotal = existing ? Number(existing.total ?? 0) : undefined;

    if (!existing) {
      // first occurrence for this carrier+service code
      map.set(key, svc);
    } else {
      if (carrier === 'USPS') {
        // Para USPS, manter a MAIS CARA do grupo
        if (existingTotal === undefined || currentTotal > existingTotal) {
          map.set(key, svc);
        }
      } else {
        // Para outros carriers, manter a mais barata (comportamento original)
        if (existingTotal === undefined || currentTotal < existingTotal) {
          map.set(key, svc);
        }
      }
    }
  }

  return Array.from(map.values());
}

function normalizeCountryCode(country?: string | null): string {
  const raw = (country || '').trim();
  if (!raw) return 'US';

  // If already looks like an ISO 2-letter code, just uppercase it
  if (raw.length === 2) {
    return raw.toUpperCase();
  }

  const upper = raw.toUpperCase();
  if (
    upper === 'UNITED STATES' ||
    upper === 'UNITED STATES OF AMERICA' ||
    upper === 'USA'
  ) {
    return 'US';
  }

  // Default fallback to US for now
  return 'US';
}

export default function Step5DeliveryPreferences({
  draftId,
  initialPreferences,
  onNext,
  onBack,
}: Step5DeliveryPreferencesProps) {
  const supabase  = useSupabase()
  const router = useRouter();

  const patchDraft = async (patch: any) => {
    const res = await fetch(`/api/quotes/drafts/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json?.error || json?.message || 'Failed to update draft')
    }

    return (json?.draft ?? json?.data?.draft ?? null) as any
  }
  const [loading, setLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<QuoteDraft | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [quoteResults, setQuoteResults] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [shippingMode, setShippingMode] = useState<'parcel' | 'ltl'>('parcel');
  const {
    rates,
    loading: isLoadingRates,
    error: carrierError,
    fetchRates,
  } = useCarrierMultiBoxRates();
  // After loading draft, set selectedService from previously saved service if exists
  useEffect(() => {
    if (draft?.selected_service) {
      setSelectedService(draft.selected_service as any);
    }
  }, [draft?.selected_service]);

  type ServiceClass = 'URGENT' | 'RAPID' | 'STANDARD' | ''

  const serviceClassMap = {
    URGENT: [
      '01', '13', '14',
      'FEDEX_FREIGHT_PRIORITY',
      'FEDEX_1_DAY_FREIGHT',
      'FEDEX_FIRST_FREIGHT',
      'FIRST_OVERNIGHT'
    ],
    RAPID: ['02', '59', 'FEDEX_2_DAY_FREIGHT'],
    STANDARD: ['03', '12', '75', 'FEDEX_3_DAY_FREIGHT', 'FEDEX_FREIGHT_ECONOMY', 'GROUND_HOME_DELIVERY']
  }

  const classFilterRaw = draft?.preferences?.service_class
  const classFilter: ServiceClass = ['URGENT', 'RAPID', 'STANDARD'].includes(classFilterRaw || '')
  ? (classFilterRaw as ServiceClass)
  : '';
  const filteredQuoteResults = [...quoteResults]
  .filter((service) => {
    if (!classFilter) return true;
    const codes = serviceClassMap[classFilter];
    const serviceCode = service.carrier_service_code ?? service.code ?? service.serviceCode;
    return codes?.includes(serviceCode);
  })
  .sort((a, b) => {
    const aTotal = Number(a.total ?? 0);
    const bTotal = Number(b.total ?? 0);
    return aTotal - bTotal;
  });

  // Pega o draft atual pelo draftId
  useEffect(() => {
    const fetchDraftById = async () => {
      const { data, error } = await supabase
        .from('saip_quote_drafts')
        .select('*')
        .eq('id', draftId)
        .maybeSingle()

      if (error || !data) {
        console.error('❌ Error fetching draft by ID:', error)
        setLoading(false)
        return
      }

      const filledDraft = {
        ship_from_warehouse: '',
        ...data,
        preferences: {
          weight: '',
          package_type: '',
          length: '',
          width: '',
          height: '',
          confirmation: '',
          service_class: '',
          residential: false,
          ...(data?.preferences || {}),
        },
        ship_from: {
          address: {
            zip_code: '',
            ...(data?.ship_from?.address || {}),
          },
          ...(data?.ship_from || {}),
        },
        ship_to: {
          zip_code: '',
          ...(data?.ship_to || {}),
        },
        items: [],
      }

      const draftItems = data?.items || []
      filledDraft.items = draftItems
      setItems(draftItems)

      setDraft(filledDraft)
      if (data.quote_results) {
        const deduped = dedupeServicesByCarrierAndCode(data.quote_results as any[]);
        setQuoteResults(deduped);
      }
      setLoading(false)
    }

    fetchDraftById()
  }, [draftId])

  const updateDraft = async (field: string, value: any) => {
    if (!draft?.id) return
    setDraft({ ...draft, [field]: value })

    const { error } = await supabase
      .from('saip_quote_drafts')
      .update({ [field]: value })
      .eq('id', draft.id)

    if (error) {
      console.error(`❌ Error updating draft (${field}):`, error)
    }
  }

  // Calcula o peso total dos itens e média das dimensões e atualiza draft.preferences automaticamente
  useEffect(() => {
    if (!draft || !items || items.length === 0) return;

    // If we already have a computed box_count (multi-box packing), do not override
    if ((draft.preferences as any)?.box_count) {
      return;
    }

    const totalWeight = items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const weight = Number(item.weight_lbs || 0);
      return sum + qty * weight;
    }, 0);

    const formatted = totalWeight.toFixed(2);

    // Calculate average dimensions
    const totalLength = items.reduce((sum, item) => sum + Number(item.length || 0) * Number(item.quantity || 0), 0);
    const totalWidth = items.reduce((sum, item) => sum + Number(item.width || 0) * Number(item.quantity || 0), 0);
    const totalHeight = items.reduce((sum, item) => sum + Number(item.height || 0) * Number(item.quantity || 0), 0);
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;

    const avgLength = (totalLength / totalQty).toFixed(2);
    const avgWidth = (totalWidth / totalQty).toFixed(2);
    const avgHeight = (totalHeight / totalQty).toFixed(2);

    if (
      Number(draft.preferences?.weight) !== Number(formatted) ||
      draft.preferences?.length !== avgLength ||
      draft.preferences?.width !== avgWidth ||
      draft.preferences?.height !== avgHeight
    ) {
      updateDraft('preferences', {
        ...draft.preferences,
        weight: formatted,
        length: avgLength,
        width: avgWidth,
        height: avgHeight,
      });
    }
  }, [items, draft]);

  // Precompute multi-box packing so user can see boxes before simulating
  useEffect(() => {
    if (!draft || !items || items.length === 0) return;

    const prefs: any = draft.preferences || {};
    const packingStrategy: 'balanced' | 'min_boxes' = (prefs.packing_strategy as any) || 'balanced';

    const itemsForQuote = (items || []).map((item) => ({
      length: Number(item.length || 0),
      width: Number(item.width || 0),
      height: Number(item.height || 0),
      weight_lbs: Number(item.weight_lbs || 0),
      quantity: Number(item.quantity || 0),
    }));

    // If there are no valid dimensions at all, skip
    const hasAnyDims = itemsForQuote.some(
      (it) => it.length > 0 && it.width > 0 && it.height > 0 && it.quantity > 0
    );
    if (!hasAnyDims) return;

    try {
      const { totalWeight, totalVolume, box } = computeMultiBoxFromItems(
        itemsForQuote as any,
        {
          maxWeightPerBox: 145,
          maxLengthPlusGirth: 165,
          strategy: packingStrategy,
        } as any
      );

      const lengthPlusGirth = box.length + 2 * (box.width + box.height);

      const nextPrefs: any = {
        ...prefs,
        packing_strategy: packingStrategy,
        // totals
        weight: Number(totalWeight.toFixed(2)),
        volume: Number(totalVolume.toFixed(2)),
        // per-box geometry
        length: Number(box.length.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        box_count: box.boxCount,
        per_box_weight: Number(box.weightPerBox.toFixed(2)),
        length_plus_girth: Number(lengthPlusGirth.toFixed(2)),
        largest_dimension: box.largestDimension,
      };

      const current = prefs as any;
      const unchanged =
        Number(current.weight ?? 0) === nextPrefs.weight &&
        Number(current.volume ?? 0) === nextPrefs.volume &&
        Number(current.length ?? 0) === nextPrefs.length &&
        Number(current.width ?? 0) === nextPrefs.width &&
        Number(current.height ?? 0) === nextPrefs.height &&
        Number(current.per_box_weight ?? 0) === nextPrefs.per_box_weight &&
        Number(current.length_plus_girth ?? 0) === nextPrefs.length_plus_girth &&
        Number(current.largest_dimension ?? 0) === nextPrefs.largest_dimension &&
        current.box_count === nextPrefs.box_count &&
        (current.packing_strategy || 'balanced') === nextPrefs.packing_strategy;

      if (!unchanged) {
        updateDraft('preferences', nextPrefs);
      }
    } catch (e) {
      console.error('[MULTIBOX][Step5][auto] Failed to precompute packing:', e);
    }
  }, [draft, items, (draft as any)?.preferences?.packing_strategy]);

  // Quando chegarem novas rates normalizadas da edge get_carrier_rates,
  // convertemos para o formato unificado usado hoje em quote_results
  useEffect(() => {
    if (!rates || rates.length === 0) return;

    const unifiedServices = rates.map((r: any) => ({
      carrier: r.carrier, // "UPS", "FedEx", "USPS"
      carrier_service_code: r.service_code,
      carrier_service_name: r.display_name || r.service_name || 'Service',
      total: Number(r.total ?? 0),
      currency: r.currency ?? 'USD',
      deliveryDays: r.delivery_days ?? null,
      deliveryTime: null,
      metadata: {
        raw: r,
        box_count: r.box_count,
        per_box_weight: r.per_box_weight,
        per_box_dimensions: r.per_box_dimensions,
      },
    }));

    const dedupedServices = dedupeServicesByCarrierAndCode(unifiedServices);
    

    setQuoteResults(dedupedServices);
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        quote_results: dedupedServices as any,
      } as QuoteDraft;
    });

    // persiste no banco sem depender do draft no array de dependências
    supabase
      .from('saip_quote_drafts')
      .update({ quote_results: dedupedServices })
      .eq('id', draftId)
      .then(({ error }) => {
        if (error) {
          console.error('❌ Error updating quote_results from carrier rates:', error);
        }
      });
  }, [rates, supabase, draftId]);

  if (loading) return <div>Loading...</div>
  if (!draft) return <div>No draft found.</div>

  // Define the shouldShowResults variable as required
  const quote = draft;
  const shouldShowResults = quote.status !== 'quoted' && quoteResults.length > 0;

  // Get optimized package if available
  const optimizedPackage = draft.preferences?.optimized_packages?.[0];

  // Derive basic geometry/weight from preferences for LTL candidacy.
  // Prefer precomputed multi-box data (per_box_* fields) when available.
  const prefsAny: any = draft.preferences || {};

  // Freight override derived values
  const shippingPriceMode: 'quoted' | 'manual' =
    (prefsAny.shipping_price_mode === 'manual' || prefsAny.shipping_price_mode === 'quoted')
      ? prefsAny.shipping_price_mode
      : 'quoted'

  const manualShippingTotalRaw = prefsAny.manual_shipping_total
  const manualShippingTotal =
    manualShippingTotalRaw === null || manualShippingTotalRaw === undefined
      ? ''
      : String(manualShippingTotalRaw)

  const manualShippingCurrency = (prefsAny.manual_shipping_currency || 'USD') as string

  const manualServiceNameRaw = prefsAny.manual_shipping_service_name
  const manualServiceName =
    manualServiceNameRaw === null || manualServiceNameRaw === undefined ? '' : String(manualServiceNameRaw)

  const manualDeliveryDaysRaw = prefsAny.manual_shipping_delivery_days
  const manualDeliveryDays =
    manualDeliveryDaysRaw === null || manualDeliveryDaysRaw === undefined ? '' : String(manualDeliveryDaysRaw)

  const manualDeliveryDaysNum = manualDeliveryDays ? Number(manualDeliveryDays) : null

  const effectiveServiceName =
    shippingPriceMode === 'manual'
      ? (manualServiceName || 'Manual service')
      : (selectedService?.carrier_service_name ||
          selectedService?.description ||
          selectedService?.serviceName ||
          selectedService?.name ||
          'Unnamed service')

  const effectiveDeliveryDays =
    shippingPriceMode === 'manual'
      ? (manualDeliveryDaysNum !== null && Number.isFinite(manualDeliveryDaysNum)
          ? `${manualDeliveryDaysNum} business day(s)`
          : 'Estimated')
      : (selectedService?.deliveryDays
          ? `${selectedService.deliveryDays} business day(s)`
          : 'Estimated')

  const effectiveCostText =
    shippingPriceMode === 'manual'
      ? (manualShippingTotal !== '' && !isNaN(Number(manualShippingTotal))
          ? `$${Number(manualShippingTotal).toFixed(2)}`
          : 'To be calculated')
      : (selectedService?.total !== undefined && !isNaN(Number(selectedService.total))
          ? `$${Number(selectedService.total).toFixed(2)}`
          : 'To be calculated')

  const showActionsBar = shippingPriceMode === 'manual' || !!selectedService
  const canSaveQuote =
    (shippingPriceMode === 'manual'
      ? (manualShippingTotal !== '' && !isNaN(Number(manualShippingTotal)))
      : !!selectedService)
  const boxCount = prefsAny.box_count as number | undefined;

  const totalWeightRaw = Number(prefsAny.weight || 0);
  const perBoxWeight = Number(
    prefsAny.per_box_weight ||
      (boxCount && boxCount > 0 ? totalWeightRaw / boxCount : totalWeightRaw),
  );

  const length = Number(prefsAny.length || 0);
  const width = Number(prefsAny.width || 0);
  const height = Number(prefsAny.height || 0);

  const lengthPlusGirth = Number(
    prefsAny.length_plus_girth || length + 2 * (width + height),
  );

  const largestDim = Number(
    prefsAny.largest_dimension || Math.max(length, width, height),
  );

  // Simple physical triggers for LTL candidacy (hybrid rules will also consider price later)
  const ltlPhysicalCandidate =
    perBoxWeight >= 60 || // heavy box
    lengthPlusGirth >= 130 || // oversize dimensions
    (boxCount ?? 0) >= 4; // many boxes in one shipment

  const selectedBoxCount =
    (selectedService as any)?.metadata?.box_count ?? null;
  const selectedBoxDims =
    (selectedService as any)?.metadata?.per_box_dimensions ?? null;

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6 xl:gap-2 w-full px-3 md:px-4 xl:px-0 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full lg:w-2/5 p-3 md:p-5 xl:p-6 rounded shadow bg-white">
        <h2 className="text-xl font-bold mb-1">
          {quoteResults.length > 0 ? 'Compare & select a service' : 'Configure Rates'}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {quoteResults.length > 0
            ? 'Review the options on the right and choose the best service for this shipment.'
            : 'Set origin, destination and package details to simulate shipping services.'}
        </p>

        {/* Ship From */}
        <div className="border-b pb-4 mb-4">
        <h3 className="font-semibold text-lg mb-2">Ship From</h3>
          <label className="block text-sm font-medium mt-4">Postal Code</label>
          <Input
            placeholder="Zip code from warehouse"
            value={draft.ship_from?.address?.zip_code || ''}
            onChange={(e) =>
              updateDraft('ship_from', {
                ...draft.ship_from,
                address: {
                  ...draft.ship_from?.address,
                  zip_code: e.target.value,
                },
              })
            }
          />
        </div>

        {/* Ship To */}
        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">Ship To</h3>

          <label className="block text-sm font-medium">Postal Code</label>
          <Input
            placeholder="Zip code of destination"
            value={draft.ship_to?.zip_code || ''}
            onChange={(e) =>
              updateDraft('ship_to', {
                ...draft.ship_to,
                zip_code: e.target.value,
              })
            }
          />

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="residential"
              className="h-4 w-4"
              checked={draft.preferences?.residential || false}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  residential: e.target.checked,
                })
              }
            />
            <label htmlFor="residential" className="text-sm">Residential Address</label>
          </div>
        </div>

        {/* Shipment Info */}
        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">Shipment Information</h3>

          {boxCount && (
            <p className="mt-1 text-[11px] text-muted-foreground text-sm mb-2">
              Packages qty: <strong>{boxCount}</strong>
            </p>
          )}

          <label className="block text-sm font-medium">Weight (lb)</label>
          <Input
            placeholder="Total weight"
            value={optimizedPackage?.weight || draft.preferences?.weight || ''}
            onChange={(e) =>
              updateDraft('preferences', {
                ...draft.preferences,
                weight: e.target.value,
              })
            }
          />



          <label className="block text-sm font-medium mt-4">Size (in)</label>
<div className="flex flex-col gap-2">
  {boxCount && boxCount > 1 && (draft.preferences as any)?.packing_strategy === 'min_boxes' && (
    <p className="text-[11px] text-amber-600">
      ⚠️ Using strategy: <strong>Fewer boxes</strong>. Dimensions shown reflect largest-box packing.
    </p>
  )}
  {selectedBoxCount && selectedBoxDims && (
    <p className="mt-1 text-[11px] text-muted-foreground">
      Packing result:&nbsp;
      <strong>{selectedBoxCount}</strong> box
      {selectedBoxCount > 1 ? 'es' : ''} of{' '}
      {selectedBoxDims.length} × {selectedBoxDims.width} × {selectedBoxDims.height} in
    </p>
  )}
  <div className="flex gap-2">
    <Input
      placeholder="Length"
      value={
        (draft.preferences as any)?.packing_strategy === 'min_boxes'
          ? (draft.preferences as any)?.length
          : (
              selectedBoxDims?.length ??
              optimizedPackage?.length ??
              (draft.preferences as any)?.length ??
              ''
            )
      }
      onChange={(e) =>
        updateDraft('preferences', {
          ...(draft.preferences as any),
          length: e.target.value,
        })
      }
    />
    <Input
      placeholder="Width"
      value={
        (draft.preferences as any)?.packing_strategy === 'min_boxes'
          ? (draft.preferences as any)?.width
          : (
              selectedBoxDims?.width ??
              optimizedPackage?.width ??
              (draft.preferences as any)?.width ??
              ''
            )
      }
      onChange={(e) =>
        updateDraft('preferences', {
          ...(draft.preferences as any),
          width: e.target.value,
        })
      }
    />
    <Input
      placeholder="Height"
      value={
        (draft.preferences as any)?.packing_strategy === 'min_boxes'
          ? (draft.preferences as any)?.height
          : (
              selectedBoxDims?.height ??
              optimizedPackage?.height ??
              (draft.preferences as any)?.height ??
              ''
            )
      }
      onChange={(e) =>
        updateDraft('preferences', {
          ...(draft.preferences as any),
          height: e.target.value,
        })
      }
    />
  </div>

          {/* Freight override */}
          <div className="mt-4">
            <label className="block text-sm font-medium">Freight</label>
            <p className="text-[11px] text-muted-foreground">
              Choose how the freight price should be calculated.
            </p>

            <div className="mt-2 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  updateDraft('preferences', {
                    ...(draft.preferences as any),
                    shipping_price_mode: 'quoted',
                    // keep manual values for convenience, but quoted will be used
                    manual_shipping_currency: manualShippingCurrency || 'USD',
                  })
                }
                className={cn(
                  'flex-1 rounded border px-3 py-1 text-center',
                  shippingPriceMode === 'quoted'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-white text-muted-foreground',
                )}
              >
                Use quoted rate
              </button>

              <button
                type="button"
                onClick={() =>
                  updateDraft('preferences', {
                    ...(draft.preferences as any),
                    shipping_price_mode: 'manual',
                    manual_shipping_currency: manualShippingCurrency || 'USD',
                    manual_shipping_total:
                      (draft.preferences as any)?.manual_shipping_total ??
                      (selectedService?.total ?? null),
                    manual_shipping_service_name:
                      (draft.preferences as any)?.manual_shipping_service_name ??
                      (selectedService?.carrier_service_name ||
                        selectedService?.service_name ||
                        selectedService?.serviceName ||
                        null),
                    manual_shipping_delivery_days:
                      (draft.preferences as any)?.manual_shipping_delivery_days ??
                      (selectedService?.deliveryDays ?? null),
                  })
                }
                className={cn(
                  'flex-1 rounded border px-3 py-1 text-center',
                  shippingPriceMode === 'manual'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-white text-muted-foreground',
                )}
              >
                Set manually
              </button>
            </div>

            {shippingPriceMode === 'manual' && (
              <div className="mt-3">
                <label className="block text-sm font-medium">Manual freight ({manualShippingCurrency})</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={manualShippingTotal}
                  onChange={(e) => {
                    const raw = e.target.value
                    const num = raw === '' ? null : Number(raw)
                    updateDraft('preferences', {
                      ...(draft.preferences as any),
                      shipping_price_mode: 'manual',
                      manual_shipping_currency: manualShippingCurrency || 'USD',
                      manual_shipping_total: num !== null && Number.isFinite(num) ? num : null,
                    })
                  }}
                />

                <div className="mt-3">
                  <label className="block text-sm font-medium">Service name</label>
                  <Input
                    placeholder="e.g. USPS Ground Advantage"
                    value={manualServiceName}
                    onChange={(e) => {
                      const v = e.target.value
                      updateDraft('preferences', {
                        ...(draft.preferences as any),
                        shipping_price_mode: 'manual',
                        manual_shipping_currency: manualShippingCurrency || 'USD',
                        manual_shipping_service_name: v.trim() ? v : null,
                      })
                    }}
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium">Delivery days</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    placeholder="e.g. 5"
                    value={manualDeliveryDays}
                    onChange={(e) => {
                      const raw = e.target.value
                      const num = raw === '' ? null : Number(raw)
                      updateDraft('preferences', {
                        ...(draft.preferences as any),
                        shipping_price_mode: 'manual',
                        manual_shipping_currency: manualShippingCurrency || 'USD',
                        manual_shipping_delivery_days: num !== null && Number.isFinite(num) ? num : null,
                      })
                    }}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Used for display only (e.g. “5 business day(s)”).
                  </p>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  This value will override any carrier quote when creating the order. Service name and delivery days are optional.
                </p>
              </div>
            )}

            {shippingPriceMode === 'quoted' && selectedService?.total !== undefined && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Current selection: <strong>${Number(selectedService.total).toFixed(2)}</strong> ({selectedService.carrier || 'Carrier'})
              </p>
            )}
          </div>

          {/* LTL candidate notice + shipping mode selector */}
          <div className="mt-4">
            {ltlPhysicalCandidate && (
              <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                This shipment looks like a good candidate for <strong>LTL Freight</strong> based on weight,
                dimensions or number of boxes.
              </div>
            )}

            <label className="block text-sm font-medium">Shipping Mode</label>
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShippingMode('parcel')}
                className={cn(
                  'flex-1 rounded border px-3 py-1 text-center',
                  shippingMode === 'parcel'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-white text-muted-foreground',
                )}
              >
                Parcel (Small Package)
              </button>
              <button
                type="button"
                onClick={() => ltlPhysicalCandidate && setShippingMode('ltl')}
                disabled={!ltlPhysicalCandidate}
                className={cn(
                  'flex-1 rounded border px-3 py-1 text-center',
                  shippingMode === 'ltl'
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border bg-white text-muted-foreground',
                  !ltlPhysicalCandidate && 'opacity-50 cursor-not-allowed',
                )}
              >
                LTL Freight
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Confirmation & Service */}
        <div>
          <label className="block text-sm font-medium">Confirmation</label>
          <select
            className="w-full border rounded px-3 py-2 mt-1"
            value={draft.preferences?.confirmation || ''}
            onChange={(e) =>
              updateDraft('preferences', {
                ...draft.preferences,
                confirmation: e.target.value,
              })
            }
          >
            <option value="NONE">No Confirmation</option>
            <option value="SIGNATURE">Signature Required</option>
          </select>

         {/* <label className="block text-sm font-medium mt-4">Service Class</label>
          <select
            className="w-full border rounded px-3 py-2 mt-1"
            value={draft.preferences?.service_class || ''}
            onChange={(e) =>
              updateDraft('preferences', {
                ...draft.preferences,
                service_class: e.target.value,
              })
            }
          >
            <option value="">Show All</option>
            <option value="URGENT">Urgent</option>
            <option value="RAPID">Rapid</option>
            <option value="STANDARD">3 Days+</option>
          </select>*/}
        </div> 

        <div className="mt-6 flex justify-end">
        <Button
  disabled={isSimulating}
  className="bg-[#3B2680] text-white"
  onClick={async () => {
    // If user selected LTL mode, simulate a Fairgrounds connection error
    if (shippingMode === 'ltl') {
      console.error('[LTL][Fairgrounds] Connection failed: invalid API key (simulated).');
      toast.error(
        'Failed to connect to Fairgrounds LTL: invalid API key. Please contact SynC support.',
      );
      return;
    }

    // Continua mantendo o comportamento atual de preencher defaults (Parcel mode)
    const weight = (draft.preferences as any)?.weight || '1.0';
    const length = (draft.preferences as any)?.length || '10.0';
    const width = (draft.preferences as any)?.width || '10.0';
    const height = (draft.preferences as any)?.height || '10.0';

    if (
      !(draft.preferences as any)?.weight ||
      !(draft.preferences as any)?.length ||
      !(draft.preferences as any)?.width ||
      !(draft.preferences as any)?.height
    ) {
      toast.warning(
        'Weight and dimensions were missing. Default values were applied: 10x10x10 inches, 1 lb.',
      );
    }

    const packingStrategy = (draft.preferences as any)?.packing_strategy || 'balanced';

    const itemsForQuote = (items || []).map((item) => ({
      length: Number(item.length || 0),
      width: Number(item.width || 0),
      height: Number(item.height || 0),
      weight_lbs: Number(item.weight_lbs || 0),
      quantity: Number(item.quantity || 0),
    }));

    // Only update preferences if we had to apply defaults
    const prefsAny: any = draft.preferences || {};
    const needsDefaults =
      !prefsAny.weight || !prefsAny.length || !prefsAny.width || !prefsAny.height;

    if (needsDefaults) {
      const updatedPreferences: any = {
        ...prefsAny,
        weight,
        length,
        width,
        height,
        packing_strategy: packingStrategy,
      };
      await updateDraft('preferences', updatedPreferences);
    }

    // Prepara origem/destino para ShipEngine
    const from = {
      country_code: normalizeCountryCode(draft.ship_from?.address?.country),
      postal_code: (draft.ship_from?.address?.zip_code || '').trim(),
      city_locality: draft.ship_from?.address?.city || '',
      state_province: draft.ship_from?.address?.state || '',
    };

    const to = {
      country_code: normalizeCountryCode(draft.ship_to?.country),
      postal_code: (draft.ship_to?.zip_code || '').trim(),
      city_locality: draft.ship_to?.city || '',
      state_province: draft.ship_to?.state || '',
    };

    if (!itemsForQuote.length) {
      toast.error('No items found for this quote. Please review the package step.');
      return;
    }

    setIsSimulating(true);
    const resultSection = document.getElementById('quote-results');
    if (resultSection) {
      resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      await fetchRates({
        accountId: draft.account_id,
        from,
        to,
        items: itemsForQuote,
        ship_date: new Date().toISOString(),
        packing_strategy: packingStrategy,
      } as any);

      if (carrierError) {
        console.error('❌ Error from carrier rates:', carrierError);
        toast.error(carrierError);
      }
    } catch (err) {
      console.error('❌ Error fetching carrier rates:', err);
      toast.error('Failed to fetch carrier rates.');
    } finally {
      setIsSimulating(false);
    }
  }}
>
  {isSimulating ? 'Simulating...' : 'Simulate'}
</Button>
        </div>

      </div>

      
        <div
          id="quote-results"
          className="w-full lg:w-2/5 bg-muted/50 p-2 md:p-5 xl:p-6 rounded-none md:rounded-lg -mx-3 md:mx-0"
        >
          <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-3 mb-3 bg-muted/80 backdrop-blur px-3 py-2 md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold">Quote Results</h2>
          </div>
          {isSimulating ? (
            <p className="text-muted-foreground text-sm italic">Fetching quotes, please wait...</p>
          ) : (
            (() => {
              if (!quote.quote_results || quote.quote_results.length === 0) {
                return (
                  <p className="text-muted-foreground text-sm">
                    No quote results found. Please run the simulation to view available shipping options.
                  </p>
                );
              }
              return (
                <div className="space-y-3">
                  {filteredQuoteResults.map((service, idx) => {
                    const serviceCode = service.carrier_service_code ?? service.code ?? service.serviceCode;
                    const serviceName =
                      service.carrier_service_name ||
                      service.description ||
                      service.serviceName ||
                      service.name ||
                      'Unnamed service';
                    const carrier = (service.carrier || '').toUpperCase();
                    const isSelected =
                      !!selectedService &&
                      (selectedService.carrier_service_code ?? selectedService.code ?? selectedService.serviceCode) ===
                        serviceCode &&
                      (selectedService.carrier || '').toUpperCase() === carrier;
                    const isCheapest = idx === 0;
                    const logoUrl =
                      carrier === 'FEDEX'
                        ? 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img/fedex.png'
                        : carrier === 'UPS'
                        ? 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img/ups.png'
                        : carrier === 'USPS'
                        ? 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img/usps.png'
                        : 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img/ups.png';

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedService(service);
                          setDraft((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              selected_service: service,
                            };
                          });
                        }}
                        className={cn(
                          'relative cursor-pointer p-3 md:p-4 border rounded-lg shadow-sm flex items-center justify-between gap-3 md:gap-4 bg-white transition-colors',
                          isSelected
                            ? 'border-primary ring-1 ring-primary bg-primary/20'
                            : 'border-muted hover:border-primary/40'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute -top-2 -right-2 bg-emerald-500 text-[10px] text-white px-2 py-0.5 rounded-full shadow">
                            Selected
                          </span>
                        )}
                        <div className="flex items-center gap-4">
                          <img
                            src={logoUrl}
                            alt={carrier || 'Carrier'}
                            className="w-9 h-9 md:w-10 md:h-10 object-contain"
                          />
                          <div>
                            <p className="font-semibold">{serviceName}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.deliveryDays
                                ? `${service.deliveryDays} business day(s)`
                                : 'Estimated delivery'}
                              {service.deliveryTime ? ` by ${service.deliveryTime}` : ''}
                            </p>
                            {isCheapest && !isSelected && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium px-2 py-0.5 mt-1">
                                Recommended • Lowest cost
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-green-600 font-bold text-lg flex items-center gap-1">
                            {service.total ? `$${Number(service.total).toFixed(2)}` : 'N/A'}
                            {isSelected && <span className="text-xs text-emerald-600">✓</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>

      {showActionsBar && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Selected service</p>
              <p className="truncate text-sm font-semibold">{effectiveServiceName}</p>
              <p className="text-xs text-muted-foreground">Delivery: <strong>{effectiveDeliveryDays}</strong> • Cost: <strong>{effectiveCostText}</strong></p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="w-full md:w-auto"
                disabled={saving || !canSaveQuote}
                onClick={async () => {
                  if (!canSaveQuote) {
                    toast.error(
                      shippingPriceMode === 'manual'
                        ? 'Please set a valid manual freight value.'
                        : 'Please select a service first.'
                    )
                    return
                  }

                  try {
                    setSaving(true)

                    const selectedServiceToPersist =
                      shippingPriceMode === 'manual'
                        ? {
                            carrier: (selectedService?.carrier || 'MANUAL'),
                            carrier_service_code: 'manual',
                            carrier_service_name: manualServiceName || 'Manual freight',
                            total: Number(manualShippingTotal),
                            currency: manualShippingCurrency || 'USD',
                            deliveryDays:
                              manualDeliveryDaysNum !== null && Number.isFinite(manualDeliveryDaysNum)
                                ? manualDeliveryDaysNum
                                : null,
                            metadata: { source: 'manual' },
                          }
                        : selectedService

                    const next = await patchDraft({
                      selected_service: selectedServiceToPersist,
                      status: 'quoted',
                      updated_at: new Date().toISOString(),
                    })

                    if (next) {
                      setDraft((prev) => (prev ? { ...prev, ...next } : prev))
                    }

                    toast.success('Selection saved successfully!')
                    router.push('/orders/quotes')
                  } catch (err) {
                    console.error('❌ Failed to save selection:', err)
                    toast.error('Failed to save selection.')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save quote'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer so content isn't hidden behind the fixed bottom bar */}
      {showActionsBar && <div className="h-20" />}
    </div>
  )
}
// Utility for className concatenation
function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}

  // Ensure we only run .find() if draft.selected_service?.serviceCode is defined
  // Example:
  // const selectedResult = draft.selected_service?.serviceCode
  //   ? quoteResults.find((r) => r.code === draft.selected_service!.serviceCode)
  //   : undefined;