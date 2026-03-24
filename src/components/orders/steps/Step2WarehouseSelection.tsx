'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Warehouse as WarehouseIcon } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import type { Database } from '@/types/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Warehouse = {
  id: string
  name: string | null
  source?: string | null
  wms_facility_id?: string | null
  sellercloud_id?: string | null
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

  useEffect(() => {
    const fetchWarehouses = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Resolve role/account from DB first (more reliable than auth metadata).
      let resolvedRole: string | null = null
      let resolvedAccountId: string | null = null
      const sessionUserId = session?.user?.id ?? null
      if (sessionUserId) {
        const { data: me } = await supabase
          .from('users')
          .select('role, account_id')
          .eq('id', sessionUserId)
          .maybeSingle()
        if (me) {
          resolvedRole = (me as any).role ? String((me as any).role) : null
          resolvedAccountId = (me as any).account_id ? String((me as any).account_id) : null
        }
      }

      // Fallback to metadata only if DB lookup is unavailable.
      const metaAccountId = (session?.user?.user_metadata?.account_id as string | undefined) ?? null
      const metaRole = (session?.user?.user_metadata?.role as string | undefined) ?? null

      // Always fetch the draft so we can:
      // - read current ship_from.warehouse_id
      // - fallback to draft.account_id when session is missing
      const { data: draftData, error: draftError } = await supabase
        .from('saip_quote_drafts')
        .select('ship_from, account_id, preferences')
        .eq('id', draftId)
        .single()

      if (draftError) {
        console.error('❌ Error fetching draft:', draftError)
        toast.error('Could not load draft')
        setLoadingDraft(false)
        return
      }

      const draftAccountId = (draftData as any)?.account_id as string | null
      const accountId = resolvedAccountId || metaAccountId || draftAccountId
      const role = (resolvedRole || metaRole || '').toLowerCase()
      const preferences = (draftData as any)?.preferences
      const prefsObj =
        preferences && typeof preferences === 'object'
          ? preferences
          : typeof preferences === 'string'
            ? (() => {
                try {
                  return JSON.parse(preferences)
                } catch {
                  return {}
                }
              })()
            : {}
      const externalService = String((prefsObj as any)?.external_service ?? '').toLowerCase()

      if (!accountId) {
        toast.error('Missing account ID')
        setLoadingDraft(false)
        return
      }

      // Role currently not used for filtering because we now read from billing warehouses API.
      void role

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

      // Prefer billing/public warehouse id first; fallback to sellercloud id if that's how it's stored.
      if (shipFromObj?.warehouse_id) {
        setSelectedWarehouse(String(shipFromObj.warehouse_id))
      } else if (shipFromObj?.sellercloud_warehouse_id) {
        setSelectedWarehouse(String(shipFromObj.sellercloud_warehouse_id))
      }

      // Read warehouses from Billing module (single source of truth).
      const res = await fetch('/api/billing/warehouses', {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('❌ Error loading billing warehouses:', json)
        toast.error('Failed to load warehouses')
        setLoadingDraft(false)
        return
      }

      const allRows: Warehouse[] = Array.isArray(json?.data)
        ? json.data.map((row: any) => ({
            id: String(row?.id || ''),
            name: String(row?.name || 'Unnamed Warehouse'),
            city: row?.city ?? null,
            state: row?.state ?? null,
            source: row?.source ?? null,
            wms_facility_id: row?.wms_facility_id ?? null,
          }))
        : []

      const filtered =
        externalService === 'sellercloud' || externalService === 'extensiv'
          ? allRows.filter((w) => String(w.source || '').toLowerCase() === externalService)
          : allRows
      setWarehouses(filtered.filter((w) => w.id))

      setLoadingDraft(false)
    }

    fetchWarehouses()
  }, [supabase, draftId, initialWarehouse])
  
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
    const { data: draftData } = await supabase
      .from('saip_quote_drafts')
      .select('preferences')
      .eq('id', draftId)
      .maybeSingle()

    const prefObj =
      (draftData as any)?.preferences && typeof (draftData as any).preferences === 'object'
        ? (draftData as any).preferences
        : {}
    const externalService = String(prefObj?.external_service ?? '').toLowerCase()

    const updatedShipFrom = {
      warehouse_id: selectedWarehouseData?.id ?? null,
      sellercloud_warehouse_id:
        externalService === 'sellercloud'
          ? String(
              selectedWarehouseData?.wms_facility_id ||
                selectedWarehouseData?.sellercloud_id ||
                selectedWarehouseData?.id ||
                ''
            )
          : null,
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select a Warehouse</h2>
        {selectedWarehouse ? (
          <span className="text-sm text-primary flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            Selected •{' '}
            {warehouses.find((w) => w.id === selectedWarehouse)?.name ?? 'Warehouse'}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Tap a card to select</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4">
        {warehouses.map((wh) => {
          const isSelected = selectedWarehouse === wh.id
          return (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouse(wh.id)}
              aria-pressed={isSelected}
              className={`group relative w-full rounded-lg border p-4 text-left transition-all duration-200
                ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-gray-200 bg-white hover:border-primary/50'}
                hover:shadow-md`}
            >
              <div className="absolute right-3 top-3 text-primary">
                {isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-muted-foreground" />}
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-white text-primary">
                  <WarehouseIcon size={28} />
                </div>
                <div>
                  <h3 className="text-md font-semibold">{wh.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Source: {String(wh.source || 'manual').toUpperCase()} • ID: {wh.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {warehouses.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No warehouses found for this account. Add a warehouse first in Billing/Warehouses.
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={!selectedWarehouse}>
          Next
        </Button>
      </div>
    </div>
  )
}
