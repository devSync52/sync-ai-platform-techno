import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { BillingClientSummary } from '@/types/billing'

type BillingClientRow = {
  id: string
  client_account_id: string | null
  name: string | null
  source: string | null
  wms_customer_id: string | null
  is_active: boolean | null
  warehouse_id: string | null
  warehouse_id_norm: string | null
  billing_method?: string | null
}

type WarehouseRow = {
  id: string
  name: string | null
  parent_account_id?: string | null
}

export async function GET() {
  const [
    { data: clients, error: clientsError },
    { data: warehouses, error: warehousesError },
  ] = await Promise.all([
    (supabaseAdmin as any)
      .from('billing_clients')
      .select('*')
      .order('name', { ascending: true }),
    (supabaseAdmin as any)
      .from('v_billing_warehouses')
      .select('id,name'),
  ])

  const firstError = clientsError || warehousesError
  if (firstError) {
    return NextResponse.json(
      { error: firstError.message },
      { status: firstError.code ? Number(firstError.code) || 500 : 500 }
    )
  }

  const clientRows = (clients ?? []) as BillingClientRow[]
  const warehouseRows = (warehouses ?? []) as WarehouseRow[]

  const warehousesById = new Map<string, WarehouseRow>()
  const warehousesByName = new Map<string, WarehouseRow>()
  warehouseRows.forEach((warehouse) => {
    warehousesById.set(warehouse.id, warehouse)
    if (warehouse.name) warehousesByName.set(warehouse.name.toLowerCase(), warehouse)
  })

  const summaries: BillingClientSummary[] = clientRows.map((client) => {
    const clientAccountId = client.client_account_id ?? client.id

    let warehouseId: string | null = null
    let warehouseName: string | null = null

    const assignWarehouse = (idOrName: string | null | undefined) => {
      if (!idOrName) return
      const direct = warehousesById.get(idOrName)
      if (direct) {
        warehouseId = direct.id
        warehouseName = direct.name
        return
      }

      const byName = warehousesByName.get(idOrName.toLowerCase())
      if (byName) {
        warehouseId = byName.id
        warehouseName = byName.name
        return
      }

      warehouseName = idOrName
    }

    assignWarehouse(client.warehouse_id_norm ?? client.warehouse_id)

    const billingMethod = client.billing_method ?? null
    const isActive = client.is_active ?? false

    return {
      recordId: client.id,
      clientAccountId,
      name: client.name ?? clientAccountId,
      isActive,
      billingMethod,
      warehouseId: warehouseId ?? null,
      warehouseName: warehouseName ?? null,
      nextInvoiceDate: null,
      mtdTotal: 0,
      source: client.source,
      wmsCustomerId: client.wms_customer_id,
    }
  })

  return NextResponse.json({ data: summaries })
}
