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
  const  supabase  = useSupabase()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)
  const [loadingDraft, setLoadingDraft] = useState(true)

  useEffect(() => {
    const fetchWarehouses = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Session not found')
        return
      }

      const accountId = session.user.user_metadata?.account_id
      const role = session.user.user_metadata?.role

      if (!accountId) {
        toast.error('Missing account ID')
        return
      }

      let effectiveAccountId = accountId

      if (role === 'client' || role === 'staff-client') {
        const { data: parentData, error: parentError } = await supabase
          .from('accounts')
          .select('parent_account_id')
          .eq('id', accountId)
          .single()

        if (parentError || !parentData?.parent_account_id) {
          console.error('❌ Error fetching parent account:', parentError)
          toast.error('Could not determine parent account')
          return
        }

        effectiveAccountId = parentData.parent_account_id
      }


      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, address_line1, address_line2, city, state, zip_code, country, phone, email')
        .eq('account_id', effectiveAccountId)
        .order('name')

      if (error) {
        console.error('❌ Error fetching warehouses:', error)
        toast.error('Failed to load warehouses')
        return
      }

      setWarehouses(data)

      const { data: draftData, error: draftError } = await supabase
        .from('saip_quote_drafts')
        .select('ship_from')
        .eq('id', draftId)
        .single()

      if (draftData?.ship_from?.warehouse_id) {
        setSelectedWarehouse(draftData.ship_from.warehouse_id)
      }

      setLoadingDraft(false)
    }

    fetchWarehouses()
  }, [supabase, initialWarehouse])
  
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

  const initialWarehouseObject = typeof initialWarehouse === 'string' ? JSON.parse(initialWarehouse || '{}') : initialWarehouse

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