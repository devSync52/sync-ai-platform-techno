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
import { useCarrierRates } from '@/hooks/useCarrierRates';

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
    const existingTotal = existing ? Number(existing.total ?? 0) : Number.POSITIVE_INFINITY;

    if (!existing || currentTotal < existingTotal) {
      map.set(key, svc);
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
  const [loading, setLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<QuoteDraft | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [quoteResults, setQuoteResults] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const { rates, loading: isLoadingRates, error: carrierError, fetchRates } = useCarrierRates();
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
      metadata: { raw: r },
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

          <label className="block text-sm font-medium mt-4">Package</label>
          <select
            className="w-full border rounded px-3 py-2 mt-1"
            value={draft.preferences?.package_type || ''}
            onChange={(e) =>
              updateDraft('preferences', {
                ...draft.preferences,
                package_type: e.target.value,
              })
            }
          >
            <option value="YOUR_PACKAGING">Your Packaging</option>
            <option value="FEDEX_BOX">FedEx Box</option>
            <option value="UPS_BOX">UPS Box</option>
          </select>

          <label className="block text-sm font-medium mt-4">Size (in)</label>
          <div className="flex gap-2">
            <Input
              placeholder="Length"
              value={optimizedPackage?.length || draft.preferences?.length || ''}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  length: e.target.value,
                })
              }
            />
            <Input
              placeholder="Width"
              value={optimizedPackage?.width || draft.preferences?.width || ''}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  width: e.target.value,
                })
              }
            />
            <Input
              placeholder="Height"
              value={optimizedPackage?.height || draft.preferences?.height || ''}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  height: e.target.value,
                })
              }
            />
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

          <label className="block text-sm font-medium mt-4">Service Class</label>
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
          </select>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={isSimulating}
            className="bg-[#3B2680] text-white"
            onClick={async () => {
              // Pre-validate and apply default dimensions/weight if missing
              const weight = draft.preferences?.weight || '1.0';
              const length = draft.preferences?.length || '10.0';
              const width = draft.preferences?.width || '10.0';
              const height = draft.preferences?.height || '10.0';

              if (
                !draft.preferences?.weight ||
                !draft.preferences?.length ||
                !draft.preferences?.width ||
                !draft.preferences?.height
              ) {
                toast.warning(
                  'Weight and dimensions were missing. Default values were applied: 10x10x10 inches, 1 lb.'
                );
              }

              const updatedPreferences = {
                ...draft.preferences,
                weight,
                length,
                width,
                height,
              };

              await updateDraft('preferences', updatedPreferences);

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

              const totalWeight = Number(weight || '1.0');

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
                  weight: {
                    value: totalWeight,
                    unit: 'pound',
                  },
                  dimensions: {
                    unit: 'inch',
                    length: Number(length || '10.0'),
                    width: Number(width || '10.0'),
                    height: Number(height || '10.0'),
                  },
                  ship_date: new Date().toISOString(),
                });

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

      {selectedService && (
        <div className="w-full lg:w-1/5 bg-white p-4 md:p-5 xl:p-6 rounded shadow border">
          <h2 className="text-xl font-bold mb-4">Actions</h2>

          <p className="text-sm mb-4">
            Selected:{' '}
            <strong>
              {selectedService.carrier_service_name ||
                selectedService.description ||
                selectedService.serviceName ||
                selectedService.name ||
                'Unnamed service'}
            </strong>
            <br />
            Delivery:{' '}
            <strong>
              {selectedService.deliveryDays
                ? `${selectedService.deliveryDays} business day(s)`
                : 'Estimated'}
            </strong>
            <br />
            Cost:{' '}
            <strong>
              {selectedService.total !== undefined && !isNaN(Number(selectedService.total))
                ? `$${Number(selectedService.total).toFixed(2)}`
                : 'To be calculated'}
            </strong>
          </p>

          <Button
            className="w-full mb-2"
            disabled={saving}
            onClick={async () => {
              if (!selectedService) {
                toast.error('Please select a service first.');
                return;
              }

              try {
                setSaving(true);

                const { error } = await supabase
                  .from('saip_quote_drafts')
                  .update({
                    selected_service: selectedService, // salva tudo
                    status: 'quoted',
                    updated_at: new Date(),
                  })
                  .eq('id', draft.id);

                if (error) {
                  console.error('❌ Failed to save selection:', error);
                  toast.error('Failed to save selection.');
                } else {
                  toast.success('Selection saved successfully!');
                  router.push('/orders/quotes');
                }
              } catch (err) {
                console.error('❌ Unexpected error saving quote:', err);
                toast.error('Unexpected error saving quote.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving...' : 'Save quote'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            This will lock this service for this quote and return to the quotes list.
          </p>




        </div>
      )}
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