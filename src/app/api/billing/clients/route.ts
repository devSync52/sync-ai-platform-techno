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

type BillingConfigRow = {
  client_id: string
  assigned_warehouse: string | null
  billing_frequency: string | null
}

type BillingInvoiceRow = {
  client_id: string | null
  period_start: string | null
  period_end: string | null
  status: string
  total: number | null
}

type WarehouseRow = {
  id: string
  name: string | null
  parent_account_id?: string | null
}

const UPCOMING_STATUSES = new Set(['draft', 'open', 'overdue'])
const CONTRIBUTING_STATUSES = new Set(['open', 'paid', 'overdue'])

export async function GET() {
  const [
    { data: clients, error: clientsError },
    { data: configs, error: configsError },
    { data: invoices, error: invoicesError },
    { data: warehouses, error: warehousesError },
  ] = await Promise.all([
    (supabaseAdmin as any)
      .from('billing_clients')
      .select('*')
      .order('name', { ascending: true }),
    (supabaseAdmin as any)
      .from('billing_configs')
      .select('client_id,assigned_warehouse,billing_frequency'),
    (supabaseAdmin as any)
      .from('billing_invoices')
      .select('client_id,period_start,period_end,status,total'),
    (supabaseAdmin as any).from('v_billing_warehouses').select('id,name'),
  ])

  const firstError =
    clientsError || configsError || invoicesError || warehousesError
  if (firstError) {
    return NextResponse.json(
      { error: firstError.message },
      { status: firstError.code ? Number(firstError.code) || 500 : 500 }
    )
  }

  const clientRows = (clients ?? []) as BillingClientRow[]
  const configRows = (configs ?? []) as BillingConfigRow[]
  const invoiceRows = (invoices ?? []) as BillingInvoiceRow[]
  const warehouseRows = (warehouses ?? []) as WarehouseRow[]

  const configsByClient = new Map<string, BillingConfigRow>()
  configRows.forEach((config) => {
    if (config.client_id) configsByClient.set(config.client_id, config)
  })

  const invoicesByClient = new Map<string, BillingInvoiceRow[]>()
  invoiceRows.forEach((invoice) => {
    if (!invoice.client_id) return
    const list = invoicesByClient.get(invoice.client_id) ?? []
    list.push(invoice)
    invoicesByClient.set(invoice.client_id, list)
  })

  const warehousesById = new Map<string, WarehouseRow>()
  const warehousesByName = new Map<string, WarehouseRow>()
  warehouseRows.forEach((warehouse) => {
    warehousesById.set(warehouse.id, warehouse)
    if (warehouse.name) warehousesByName.set(warehouse.name.toLowerCase(), warehouse)
  })

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const summaries: BillingClientSummary[] = clientRows.map((client) => {
    const clientAccountId = client.client_account_id ?? client.id
    const config = configsByClient.get(clientAccountId)
    const clientInvoices = invoicesByClient.get(clientAccountId) ?? []

    const normalizedUpcoming = clientInvoices
      .filter((invoice) => UPCOMING_STATUSES.has(invoice.status.toLowerCase()))
      .sort((a, b) => {
        const aDate = new Date(a.period_end ?? a.period_start ?? '').getTime()
        const bDate = new Date(b.period_end ?? b.period_start ?? '').getTime()
        return aDate - bDate
      })
    const nextInvoiceDate =
      normalizedUpcoming[0]?.period_end ?? normalizedUpcoming[0]?.period_start ?? null

    const mtdTotal = clientInvoices
      .filter((invoice) => {
        if (!invoice.period_start) return false
        const start = new Date(invoice.period_start)
        if (Number.isNaN(start.getTime())) return false
        return start >= startOfMonth && CONTRIBUTING_STATUSES.has(invoice.status.toLowerCase())
      })
      .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0)

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

    assignWarehouse(config?.assigned_warehouse)
    if (!warehouseId && !warehouseName) {
      assignWarehouse(client.warehouse_id_norm ?? client.warehouse_id)
    }

    const billingMethod =
      client.billing_method ?? (config ? 'postpaid' : null)
    const isActive = config ? true : client.is_active ?? false

    return {
      recordId: client.id,
      clientAccountId,
      name: client.name ?? clientAccountId,
      isActive,
      billingMethod,
      warehouseId: warehouseId ?? null,
      warehouseName: warehouseName ?? null,
      nextInvoiceDate,
      mtdTotal: Number.isNaN(mtdTotal) ? 0 : mtdTotal,
      source: client.source,
      wmsCustomerId: client.wms_customer_id,
    }
  })

  return NextResponse.json({ data: summaries })
}
