import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { BillingClientSummary } from '@/types/billing'

type BillingClientRow = {
  id: string
  parent_account_id?: string | null
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
  const cookieStore = (await cookies()) as any

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Next.js cookies() supports setting cookies in Route Handlers
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          // Prefer delete when available; otherwise overwrite with immediate expiration
          try {
            ;(cookieStore as any).delete(name)
          } catch {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          }
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Expect the parent account to be available as a claim/metadata.
  // Adjust these keys if your project stores it elsewhere.
  const parentAccountId =
    (user.user_metadata as any)?.parent_account_id ??
    (user.app_metadata as any)?.parent_account_id ??
    (user.user_metadata as any)?.account_id ??
    (user.app_metadata as any)?.account_id ??
    null

  if (!parentAccountId) {
    return NextResponse.json(
      { error: 'Missing parent_account_id on user session' },
      { status: 400 }
    )
  }

  const [
    { data: clients, error: clientsError },
    { data: warehouses, error: warehousesError },
  ] = await Promise.all([
    (supabase as any)
      .from('billing_clients')
      .select('*')
      .eq('parent_account_id', parentAccountId)
      .order('name', { ascending: true }),
    (supabase as any)
      .from('v_billing_warehouses')
      .select('id,name,parent_account_id')
      .eq('parent_account_id', parentAccountId),
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
