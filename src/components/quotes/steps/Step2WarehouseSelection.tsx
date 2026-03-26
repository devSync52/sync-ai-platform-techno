'use client'

import { useEffect, useState } from 'react'
import { Warehouse as WarehouseIcon } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import type { Database } from '@/types/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Warehouse = {
  id: string
  name: string | null
  source?: string | null
  is_default?: boolean
  wms_facility_id?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
}

type Props = {
  draftId: string
  initialWarehouse: string | null | undefined
  onWarehouseChange: (warehouseId: string | null) => void
  onNext: () => void
  onBack: () => void
}

export function Step2WarehouseSelection({
  draftId,
  initialWarehouse,
  onWarehouseChange,
  onNext,
  onBack,
}: Props) {
  const supabase = useSupabase()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(true)
  const serviceParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('service')?.toLowerCase()
      : null

  useEffect(() => {
    const fetchWarehouses = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Preferred: use session metadata when available.
      // Fallback: use the draft.account_id to locate warehouses.
      const sessionAccountId =
        (session?.user?.app_metadata as any)?.account_id ??
        (session?.user?.user_metadata as any)?.account_id

      const role =
        (session?.user?.app_metadata as any)?.role ??
        (session?.user?.user_metadata as any)?.role

      // Always fetch the draft so we can:
      // - read current ship_from.warehouse_id
      // - fallback to draft.account_id when session is missing
      const { data: draftData, error: draftError } = await supabase
        .from('saip_quote_drafts')
        .select('ship_from, account_id')
        .eq('id', draftId)
        .single()

      if (draftError) {
        console.error('❌ Error fetching draft:', draftError)
        toast.error('Could not load draft')
        setLoadingDraft(false)
        return
      }

      const draftAccountId = (draftData as any)?.account_id as string | null
      const accountId = sessionAccountId || draftAccountId

      if (!accountId) {
        toast.error('Missing account ID')
        setLoadingDraft(false)
        return
      }

      // If we have a session role indicating client, resolve parent account.
      // If we don't have a session, also attempt parent resolution as a best-effort.
      if (role === 'client' || role === 'staff-client' || !session) {
        const { data: parentData, error: parentError } = await supabase
          .from('accounts')
          .select('parent_account_id')
          .eq('id', accountId)
          .single()

        if (!parentError && parentData?.parent_account_id) {
          // We keep this in case we need it for future scoping; the billing API already scopes by parent.
        }
      }

      // If caller provided an initial warehouse id, prefer it for UI selection.
      if (initialWarehouse) {
        setSelectedWarehouse(String(initialWarehouse))
      }

      // Also prefer whatever is already saved on the draft.
      // ship_from may be JSONB or a stringified JSON.
      const shipFrom = (draftData as any)?.ship_from
      const shipFromObj = typeof shipFrom === 'string' ? (() => {
        try {
          return JSON.parse(shipFrom)
        } catch {
          return null
        }
      })() : shipFrom

      if (shipFromObj?.warehouse_id) {
        setSelectedWarehouse(String(shipFromObj.warehouse_id))
      }

      // Use Billing Warehouses API so we respect Extensiv live facilities fallback.
      const params = new URLSearchParams()
      if (serviceParam) params.set('source', serviceParam)

      const res = await fetch(`/api/billing/warehouses?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('❌ Error fetching billing warehouses:', json)
        toast.error('Failed to load warehouses')
        setLoadingDraft(false)
        return
      }

      const apiWarehouses: Warehouse[] = Array.isArray(json?.data)
        ? json.data.map((row: any) => ({
            id: String(row?.id || ''),
            name: row?.name ?? null,
            source: row?.source ?? null,
            is_default: row?.is_default ?? false,
            wms_facility_id: row?.wms_facility_id ?? null,
            address_line1: row?.address_line1 ?? null,
            address_line2: row?.address_line2 ?? null,
            city: row?.city ?? null,
            state: row?.state ?? null,
            zip_code: row?.zip_code ?? null,
            country: row?.country ?? null,
            phone: row?.phone ?? null,
            email: row?.email ?? null,
          }))
        : []

      // If we didn't already have a selection, auto-pick the default or first warehouse.
      if (!shipFromObj?.warehouse_id && !initialWarehouse && apiWarehouses.length > 0) {
        const defaultWh =
          apiWarehouses.find((w) => w.is_default) ??
          apiWarehouses.find((w) => w.id) ??
          null
        if (defaultWh?.id) setSelectedWarehouse(defaultWh.id)
      }

      setWarehouses(apiWarehouses)

      setLoadingDraft(false)
    }

    fetchWarehouses()
  }, [supabase, draftId, initialWarehouse, serviceParam])
  
  const handleNext = async () => {
    if (!selectedWarehouse) {
      toast.warning('Please select a warehouse before continuing')
      return
    }

    // Fetch existing ship_from
    const { data: existingDraft } = await supabase
      .from('saip_quote_drafts')
      .select('ship_from')
      .eq('id', draftId)
      .single()

    const selectedWarehouseData = warehouses.find(w => w.id === selectedWarehouse)

    const updatedShipFrom = {
      warehouse_id: selectedWarehouseData?.id,
      name: selectedWarehouseData?.name,
      address: {
        line1: selectedWarehouseData?.address_line1,
        line2: selectedWarehouseData?.address_line2,
        city: selectedWarehouseData?.city,
        state: selectedWarehouseData?.state,
        zip_code: selectedWarehouseData?.zip_code,
        country: selectedWarehouseData?.country,
      },
      contact: {
        phone: selectedWarehouseData?.phone,
        email: selectedWarehouseData?.email,
      },
    }

    console.log('🔁 Updating draft with:', {
      ship_from: updatedShipFrom,
      step: 2,
      draftId,
    })

    const { error } = await supabase
      .from('saip_quote_drafts')
      .update({
        ship_from: updatedShipFrom,
        step: 2,
      })
      .eq('id', draftId)

    if (error) {
      toast.error('Error saving warehouse')
    } else {
      onWarehouseChange(selectedWarehouse)
      onNext()
    }
  }

  if (loadingDraft) {
    return <div className="p-4 text-muted-foreground">Loading draft...</div>
  }

  return (
    <div className="space-y-6 p-4 bg-white">
      <h2 className="text-lg font-semibold">Select a Warehouse</h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4">
        {warehouses.map((wh) => {
          const isSelected = selectedWarehouse === wh.id
          return (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouse(wh.id)}
              className={`w-full border rounded-lg p-4 text-left transition-all duration-200
                ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-300 bg-white'}
                hover:shadow-md`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-white text-primary">
                  <WarehouseIcon size={28} />
                </div>
                <div>
                  <h3 className="text-md font-semibold">{wh.name}</h3>
                  <p className="text-sm text-muted-foreground">Warehouse ID: {wh.id.slice(0, 8)}...</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
