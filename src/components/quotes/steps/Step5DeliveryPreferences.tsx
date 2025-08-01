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
  const [draft, setDraft] = useState<QuoteDraft | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [quoteResults, setQuoteResults] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  // After loading draft, set selectedService from previously saved service if exists
  useEffect(() => {
    if (draft?.selected_service) {
      const match = draft.quote_results?.find(
        (service: any) =>
          (service.serviceCode ?? service.code) ===
          (draft.selected_service?.code)
      );
      if (match) {
        setSelectedService(match);
      }
    }
  }, [draft?.selected_service, draft?.quote_results]);

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
  const filteredQuoteResults = quoteResults.filter((service) => {
    if (!classFilter) return true
    const codes = serviceClassMap[classFilter]
    return codes?.includes(service.code)
  })

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
        setQuoteResults(data.quote_results);
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

  if (loading) return <div>Loading...</div>
  if (!draft) return <div>No draft found.</div>

  // Define the shouldShowResults variable as required
  const quote = draft;
  const shouldShowResults = quote.status !== 'quoted' && quoteResults.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="w-full lg:w-2/4 p-6 rounded shadow bg-white">
        <h2 className="text-xl font-bold mb-4">Configure Rates</h2>

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
            value={draft.preferences?.weight || ''}
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
              value={draft.preferences?.length || ''}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  length: e.target.value,
                })
              }
            />
            <Input
              placeholder="Width"
              value={draft.preferences?.width || ''}
              onChange={(e) =>
                updateDraft('preferences', {
                  ...draft.preferences,
                  width: e.target.value,
                })
              }
            />
            <Input
              placeholder="Height"
              value={draft.preferences?.height || ''}
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

              setIsSimulating(true);
              const resultSection = document.getElementById('quote-results');
              if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth' });
              }
              try {
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                const res = await fetch('/api/quotes/ups', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                  credentials: 'include',
                  body: JSON.stringify({ draft_id: draft.id }),
                });

                let data;
                const text = await res.text();
                try {
                  data = JSON.parse(text);
                } catch (jsonError) {
                  console.error('❌ Invalid JSON from API:', text);
                  throw new Error('Invalid response from server.');
                }

                if (!res.ok) {
                  console.error('❌ API error response:', data);
                  throw new Error(data?.error || 'Quote failed');
                }

                // Certifique-se de que a variável quoteResults está definida anteriormente
                const quoteResults = data.services || [];
                // Atualiza o draft local com as novas cotações
                setDraft((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    quote_results: quoteResults,
                  };
                });

                // Atualiza a lista de resultados de cotação
                setQuoteResults(quoteResults);

                await supabase
                  .from('saip_quote_drafts')
                  .update({ quote_results: data.services })
                  .eq('id', draft.id);
              } catch (err) {
                console.error('❌ Error fetching quote:', err);
                toast.error('Failed to fetch quote.');
              } finally {
                setIsSimulating(false);
              }
            }}
          >
            {isSimulating ? 'Simulating...' : 'Simulate'}
          </Button>
        </div>

      </div>

      
        <div id="quote-results" className="w-1/2 bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Quote Results</h2>
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
                    const isSelected =
                      (selectedService?.serviceCode ?? selectedService?.code) ===
                      (service.serviceCode ?? service.code);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedService(service);
                          setDraft((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              selected_service: {
                                code: service.code,
                                name: service.description || 'N/A',
                                cost: service.total || '0.00',
                                delivery_days: service.deliveryDays,
                                delivery_time: service.deliveryTime,
                              },
                            };
                          });
                        }}
                        className={cn(
                          'relative cursor-pointer p-4 border rounded-lg shadow-sm flex items-center justify-between gap-4 bg-white transition-colors',
                          isSelected
                            ? 'border-primary ring-1 ring-primary bg-primary/20'
                            : 'border-muted hover:border-primary/40'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              (service.code ?? service.serviceCode).startsWith('FEDEX') ||
                              (service.code ?? service.serviceCode) === 'GROUND_HOME_DELIVERY'
                                ? 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img//fedex.png'
                                : 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img//ups.png'
                            }
                            alt="Carrier"
                            className="w-10 h-10 object-contain"
                          />
                          <div>
                            <p className="font-semibold">{service.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.deliveryDays
                                ? `${service.deliveryDays} business day(s)`
                                : 'Estimated delivery'}
                              {service.deliveryTime ? ` by ${service.deliveryTime}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-green-600 font-bold text-lg">
                            {service.total ? `$${Number(service.total).toFixed(2)}` : 'N/A'}
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
        <div className="w-full lg:w-1/4 bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-bold mb-4">Actions</h2>

          <p className="text-sm mb-4">
            Selected:{' '}
            <strong>
              {selectedService.description || selectedService.serviceName || selectedService.name || 'Unnamed service'}
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
  onClick={async () => {
    if (!selectedService) {
      toast.error('Please select a service first.');
      return;
    }

    const { error } = await supabase
      .from('saip_quote_drafts')
      .update({
        selected_service: selectedService, // salva tudo
        status: 'quoted',
        updated_at: new Date(),
      })
      .eq('id', draft.id);

    if (error) {
      toast.error('Failed to save selection.');
    } else {
      toast.success('Selection saved successfully!');
      router.push('/orders/quotes');
    }
  }}
>
  Save quote
</Button>

          <Button
            className="w-full mb-2"
            onClick={() => {
              alert('Sending to SynC...')
            }}
          >
            Send to SynC Outbound
          </Button>


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