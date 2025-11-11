'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupabase } from '@/components/supabase-provider'
import type {
  BillingActivityEvent,
  BillingConfig,
  BillingInvoice,
  BillingInvoiceStatus,
  BillingWarehouse,
} from '@/types/billing'

type WarehouseSummary = {
  id: string
  name: string
  location: string
  total: number
  total_view?: number
  draft: number
  open: number
  overdue: number
  currency: string
}

const warehouseAccountKey = (warehouse: BillingWarehouse | undefined | null) =>
  warehouse?.account_id ?? warehouse?.parent_account_id ?? null
const STATUS_BADGE_VARIANT: Record<string, 'outline' | 'default' | 'destructive' | 'secondary'> =
  {
    draft: 'outline',
    open: 'default',
    overdue: 'destructive',
    paid: 'secondary',
  }

const FALLBACK_CURRENCY = 'USD'

const formatCurrency = (value: number | null | undefined, currency = FALLBACK_CURRENCY) => {
  const amount = Number.isFinite(value) ? Number(value) : 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

const invoiceAmount = (invoice: BillingInvoice) =>
  invoice.total ?? invoice.subtotal ?? invoice.tax ?? 0

const toDate = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatPeriod = (start: string | null | undefined, end: string | null | undefined) => {
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (!startDate && !endDate) return '—'
  if (startDate && !endDate) return format(startDate, 'MMM d, yyyy')
  if (!startDate && endDate) return format(endDate, 'MMM d, yyyy')
  if (!startDate || !endDate) return '—'

  const sameMonth = startDate.getMonth() === endDate.getMonth()
  const sameYear = startDate.getFullYear() === endDate.getFullYear()

  if (sameMonth && sameYear) {
    return `${format(startDate, 'MMM d')} – ${format(endDate, 'd, yyyy')}`
  }

  if (sameYear) {
    return `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
  }

  return `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`
}

const formatDate = (value: string | null | undefined) => {
  const parsed = toDate(value)
  return parsed ? format(parsed, 'MMM d, yyyy') : '—'
}

const invoiceStatusBadge = (status: BillingInvoiceStatus) => {
  const variant = STATUS_BADGE_VARIANT[status] ?? 'secondary'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}

const classifyEvent = (eventType: string) => {
  const normalized = eventType.toLowerCase()
  if (normalized.includes('storage')) return 'storage'
  if (
    normalized.includes('inbound') ||
    normalized.includes('handling') ||
    normalized.includes('label')
  ) {
    return 'handling'
  }
  if (
    normalized.includes('ship') ||
    normalized.includes('outbound') ||
    normalized.includes('dray') ||
    normalized.includes('pick')
  ) {
    return 'shipping'
  }
  return 'extra'
}

const eventEstimate = (event: BillingActivityEvent) => {
  const meta = (event.meta ?? {}) as Record<string, unknown>
  if (typeof meta.estimated_total === 'number') return meta.estimated_total
  if (typeof meta.amount === 'number') return meta.amount
  if (typeof meta.rate === 'number') return event.quantity * Number(meta.rate)
  return null
}

const eventDescription = (event: BillingActivityEvent) => {
  const meta = (event.meta ?? {}) as Record<string, unknown>
  return (
    (typeof meta.description === 'string' && meta.description) ||
    (typeof meta.service_name === 'string' && meta.service_name) ||
    event.event_type
  )
}

const eventCurrency = (event: BillingActivityEvent) => {
  const meta = (event.meta ?? {}) as Record<string, unknown>
  if (typeof meta.currency === 'string' && meta.currency.length === 3) {
    return meta.currency.toUpperCase()
  }
  return FALLBACK_CURRENCY
}

const matchesWarehouse = (
  invoice: BillingInvoice,
  targetWarehouseId: string,
  configsByClientId: Record<string, BillingConfig>,
  warehousesById: Record<string, BillingWarehouse>,
  warehousesByAccountId: Record<string, BillingWarehouse>,
  warehousesByName: Record<string, BillingWarehouse>
) => {
  const targetWarehouse = warehousesById[targetWarehouseId]
  const targetAccountId = warehouseAccountKey(targetWarehouse)

  if (invoice.warehouse_account_id) {
    const byAccount = warehousesByAccountId[invoice.warehouse_account_id]
    if (byAccount?.id === targetWarehouseId) return true
  }

  const config = configsByClientId[invoice.client_account_id]
  if (config) {
    if (config.assigned_warehouse === targetWarehouseId) return true
    if (config.assigned_warehouse) {
      const byName = warehousesByName[config.assigned_warehouse.toLowerCase()]
      if (byName && byName.id === targetWarehouseId) return true
    }
  }

  if (!targetWarehouse) return false

  if (targetAccountId && targetAccountId === invoice.warehouse_account_id) {
    return true
  }

  const meta = (invoice.meta ?? {}) as Record<string, unknown>
  if (typeof meta.warehouse_id === 'string' && meta.warehouse_id === targetWarehouseId) return true
  if (
    typeof meta.warehouse_account_id === 'string' &&
    targetAccountId === meta.warehouse_account_id
  ) {
    return true
  }
  if (typeof meta.warehouse_name === 'string') {
    const byName = warehousesByName[meta.warehouse_name.toLowerCase()]
    if (byName?.id === targetWarehouseId) return true
  }

  return false
}

const matchesWarehouseForEvent = (
  event: BillingActivityEvent,
  targetWarehouseId: string,
  warehousesById: Record<string, BillingWarehouse>,
  warehousesByAccountId: Record<string, BillingWarehouse>,
  warehousesByName: Record<string, BillingWarehouse>
) => {
  const meta = (event.meta ?? {}) as Record<string, unknown>

  const warehouseId = typeof meta.warehouse_id === 'string' ? meta.warehouse_id : null
  if (warehouseId && warehouseId === targetWarehouseId) return true

  const warehouseAccountId =
    typeof meta.warehouse_account_id === 'string' ? meta.warehouse_account_id : null
  if (
    warehouseAccountId &&
    warehousesByAccountId[warehouseAccountId] &&
    warehousesByAccountId[warehouseAccountId].id === targetWarehouseId
  ) {
    return true
  }

  const warehouseName =
    typeof meta.warehouse_name === 'string' ? meta.warehouse_name.toLowerCase() : null
  if (warehouseName && warehousesByName[warehouseName]?.id === targetWarehouseId) return true

  const direct = warehousesById[targetWarehouseId]
  if (!direct) return false

  if (event.meta && typeof meta.assigned_warehouse === 'string') {
    const assigned = meta.assigned_warehouse.toLowerCase()
    if (warehousesByName[assigned]?.id === targetWarehouseId) return true
  }

  return false
}

export default function BillingPage() {
  const DEFAULT_PARENT = '80dddf96-059f-4d4a-86f0-69443ceb0db9' as const
  const [searchParentId, setSearchParentId] = useState<string>(DEFAULT_PARENT)
  const supabase = useSupabase()
  useEffect(() => {
    // Allow URL param to override the default parent, but keep default if missing
    const sp = new URLSearchParams(window.location.search)
    const p = sp.get('parent')
    if (p && typeof p === 'string' && p.length > 0) {
      setSearchParentId(p)
    }
  }, [])
  // Dashboard API returns a compact row (b1_get_billing_dashboard_). We keep it flexible here.
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<'all' | string>('all')

  const requestDashboard = useCallback(async () => {
    // Target month = current month (adjust if you want via querystring)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // helpers for PostgREST date filters
    const iso = (d: Date) => d.toISOString()

    // 1) KPIs (single row)
    const kpisQ = supabase
      .from('b1_v_billing_kpis')
      .select('*')
      .eq('parent_account_id', searchParentId)
      .limit(1)

    // 2) Warehouses
    const whQ = supabase
      .from('b1_v_billing_warehouses')
      .select('*')
      .eq('parent_account_id', searchParentId)

    // 3) Upcoming invoices for the target month
    const invQ = supabase
      .from('b1_v_billing_upcoming')
      .select('*')
      .eq('parent_account_id', searchParentId)
      .gte('period_start', iso(monthStart))
      .lt('period_start',  iso(monthEnd))
      .order('period_start', { ascending: true })

    // 4) Unclassified events (optional view; if missing, fallback to empty)
    const unclassQ = supabase
      .from('b1_v_billing_unclassified')
      .select('*')
      .eq('parent_account_id', searchParentId)
      .gte('event_date', iso(monthStart))
      .lt('event_date',  iso(monthEnd))
      .order('event_date', { ascending: false })

    // 5) Accounts
    const accQ = supabase
      .from('b1_v_billing_accounts')
      .select('*')
      .eq('parent_account_id', searchParentId)

    // 6) Configs
    const cfgQ = supabase
      .from('b1_v_billing_configs')
      .select('*')
      .eq('parent_account_id', searchParentId)

    const [
      { data: kpisData,    error: kpisErr },
      { data: whData,      error: whErr },
      { data: invData,     error: invErr },
      unclassRes,
      { data: accData,     error: accErr },
      { data: cfgData,     error: cfgErr },
    ] = await Promise.all([kpisQ, whQ, invQ, unclassQ, accQ, cfgQ])

    // Normalize warehouses coming from b1_v_billing_warehouses
    // to a canonical shape used by the UI.
    const normalizedWarehouses = (whData ?? []).map((w: any) => ({
      // Core identity fields used throughout the UI
      id: w.id ?? w.warehouse_id,
      name: w.name ?? w.warehouse_name ?? 'Warehouse',
      // Optional location fields if your view exposes them
      city: w.city ?? w.warehouse_city ?? '',
      state: w.state ?? w.warehouse_state ?? '',
      // Keep common identifiers for matching logic
      parent_account_id: w.parent_account_id ?? null,
      account_id: w.account_id ?? w.warehouse_account_id ?? null,
      // Pass-through any extra fields the UI may not use directly,
      // but can be useful later (kept under the same names from the view)
      upcoming_total_usd: typeof w.upcoming_total_usd === 'string'
        ? parseFloat(w.upcoming_total_usd)
        : (w.upcoming_total_usd ?? 0),
      draft_count: w.draft_count ?? 0,
      open_count: w.open_count ?? 0,
      overdue_count: w.overdue_count ?? 0,
    }))

    let unclassData: any[] = []
    if ('error' in unclassRes && unclassRes.error) {
      console.warn('[billing] b1_v_billing_unclassified unavailable:', unclassRes.error)
    } else {
      // @ts-ignore union typing from supabase client result
      unclassData = unclassRes.data ?? []
    }

    const firstErr = kpisErr || whErr || invErr || accErr || cfgErr
    if (firstErr) {
      console.error('[billing] views fetch failed:', firstErr)
      throw firstErr
    }

    return {
      parent_account_id: searchParentId,
      kpis: (kpisData?.[0] ?? {
        mrr_est: 0,
        revenue_last_month: 0,
        open_invoices: 0,
        overdue_invoices: 0,
      }),
      warehouses: normalizedWarehouses as unknown as BillingWarehouse[],
      upcoming_invoices: invData ?? [],
      unclassified_events: unclassData ?? [],
      accounts: accData ?? [],
      configs: cfgData ?? [],
    }
  }, [supabase, searchParentId])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      // searchParentId is always defined, so no-op here
      try {
        const dashboard = await requestDashboard()
        if (active) setData(dashboard as any)
      } catch (err) {
        console.error('[billing] dashboard load failed:', err, {
          message: (err as any)?.message,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
          code: (err as any)?.code,
        })
        if (active) {
          const e: any = err ?? {}
          const msg =
            e?.message ||
            e?.details ||
            e?.hint ||
            (typeof e === 'object' ? JSON.stringify(e) : String(e)) ||
            'Failed to load billing data'
          setError(msg)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [supabase, searchParentId, requestDashboard])

  const accountsById = useMemo(() => {
    const list = (data?.accounts as any[] | undefined) ?? []
    return list.reduce<Record<string, any>>((acc, a: any) => {
      const id =
        (a && (a.id as string)) ??
        (a && (a.account_id as string)) ??
        (a && (a.client_account_id as string))
      if (id) acc[id] = a
      return acc
    }, {})
  }, [data?.accounts])

  const configsByClientId = useMemo(() => {
    const map: Record<string, BillingConfig> = {}
    const list = (data?.configs as BillingConfig[] | undefined) ?? []
    for (const config of list) {
      // accept multiple possible shapes for the client id field
      const anyConfig = config as unknown as Record<string, unknown>
      const key =
        (anyConfig['client_account_id'] as string | undefined) ??
        (anyConfig['clientId'] as string | undefined) ??
        (anyConfig['client_account'] as string | undefined) ??
        (anyConfig['client'] as string | undefined)
      if (typeof key === 'string' && key.length > 0) {
        map[key] = config
      }
    }
    return map
  }, [data?.configs])

  const warehousesByAccountId = useMemo(() => {
    const list = (data?.warehouses as BillingWarehouse[] | undefined) ?? []
    return list.reduce<Record<string, BillingWarehouse>>((acc, warehouse: BillingWarehouse) => {
      const canonicalAccountId = warehouseAccountKey(warehouse)
      if (canonicalAccountId) acc[canonicalAccountId] = warehouse
      return acc
    }, {})
  }, [data?.warehouses])

  const warehousesByName = useMemo(() => {
    const list = (data?.warehouses as BillingWarehouse[] | undefined) ?? []
    return list.reduce<Record<string, BillingWarehouse>>((acc, warehouse: BillingWarehouse) => {
      if (warehouse.name) acc[warehouse.name.toLowerCase()] = warehouse
      return acc
    }, {})
  }, [data?.warehouses])

  const warehouseEntitiesById = useMemo(() => {
    const list = (data?.warehouses as BillingWarehouse[] | undefined) ?? []
    return list.reduce<Record<string, BillingWarehouse>>((acc, w: BillingWarehouse) => {
      acc[w.id] = w
      return acc
    }, {})
  }, [data?.warehouses])

  const upcomingInvoices = useMemo(() => {
    const list = (data?.upcoming_invoices ?? data?.invoices ?? []) as BillingInvoice[]
    return list.filter((invoice: BillingInvoice) =>
      ['draft', 'open', 'overdue'].includes(String(invoice.status).toLowerCase())
    )
  }, [data?.upcoming_invoices, data?.invoices])

  const filteredUpcomingInvoices = useMemo(() => {
    if (selectedWarehouse === 'all') return upcomingInvoices
    return upcomingInvoices.filter((invoice: BillingInvoice) =>
      matchesWarehouse(
        invoice,
        selectedWarehouse,
        configsByClientId,
        warehouseEntitiesById,
        warehousesByAccountId,
        warehousesByName
      )
    )
  }, [
    upcomingInvoices,
    selectedWarehouse,
    configsByClientId,
    warehouseEntitiesById,
    warehousesByAccountId,
    warehousesByName,
  ])

  const pendingEvents = useMemo(
    () => (data?.unclassified_events ?? data?.activityEvents ?? []) as BillingActivityEvent[],
    [data?.unclassified_events, data?.activityEvents]
  )

  const filteredEvents = useMemo(() => {
    if (selectedWarehouse === 'all') return pendingEvents
    return pendingEvents.filter((event) =>
      matchesWarehouseForEvent(
        event,
        selectedWarehouse,
        warehouseEntitiesById,
        warehousesByAccountId,
        warehousesByName
      )
    )
  }, [
    pendingEvents,
    selectedWarehouse,
    warehouseEntitiesById,
    warehousesByAccountId,
    warehousesByName,
  ])

  const defaultCurrency =
    filteredUpcomingInvoices[0]?.currency ??
    upcomingInvoices[0]?.currency ??
    FALLBACK_CURRENCY

  const revenueLastMonth = useMemo(() => {
    if (!data) return 0
    const now = new Date()
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const targetMonthIndex = targetMonth.getMonth()
    const targetYear = targetMonth.getFullYear()

    return (data?.invoices ?? data?.upcoming_invoices ?? [])
      .filter((invoice: BillingInvoice) => {
        if (invoice.status !== 'paid') return false
        const start = toDate(invoice.period_start)
        if (!start) return false
        return start.getMonth() === targetMonthIndex && start.getFullYear() === targetYear
      })
      .reduce((total: number, invoice: BillingInvoice) => total + invoiceAmount(invoice), 0)
  }, [data])

  const kpis = useMemo(
    () => [
      {
        label: 'MRR (est.)',
        value: filteredUpcomingInvoices.reduce(
          (total, invoice) => total + invoiceAmount(invoice),
          0
        ),
        help: 'Estimated sum of upcoming invoices',
      },
      {
        label: 'Revenue last month',
        value: revenueLastMonth,
        help: 'Total billed and marked as paid last month',
      },
      {
        label: 'Open invoices',
        value: filteredUpcomingInvoices.filter((invoice) => invoice.status === 'open').length,
        help: 'Open (not overdue)',
      },
      {
        label: 'Overdue invoices',
        value: filteredUpcomingInvoices.filter((invoice) => invoice.status === 'overdue').length,
        help: 'Past due',
      },
    ],
    [filteredUpcomingInvoices, revenueLastMonth]
  )

  const warehouseSummaries = useMemo(() => {
    const summaries: Record<string, WarehouseSummary> = {}

    Object.values(warehouseEntitiesById).forEach((warehouse) => {
      summaries[warehouse.id] = {
        id: warehouse.id,
        name: warehouse.name ?? 'Warehouse',
        location: [warehouse.city, warehouse.state].filter(Boolean).join(', '),
        total: 0,
        total_view: (() => {
          const v = Number((warehouse as any)?.upcoming_total_usd ?? NaN)
          return Number.isFinite(v) ? v : undefined
        })(),
        draft: 0,
        open: 0,
        overdue: 0,
        currency: FALLBACK_CURRENCY,
      }
    })

    const ensureBucket = (warehouse: BillingWarehouse | undefined, invoice: BillingInvoice) => {
      if (warehouse) return summaries[warehouse.id]

      const fallbackId = `unassigned_${invoice.client_account_id}`
      if (!summaries[fallbackId]) {
        summaries[fallbackId] = {
          id: fallbackId,
          name: 'Unassigned',
          location: '—',
          total: 0,
          draft: 0,
          open: 0,
          overdue: 0,
          currency: invoice.currency ?? FALLBACK_CURRENCY,
        }
      }

      return summaries[fallbackId]
    }

    upcomingInvoices.forEach((invoice: BillingInvoice) => {
      let warehouse: BillingWarehouse | undefined

      if (invoice.warehouse_account_id) {
        warehouse = warehousesByAccountId[invoice.warehouse_account_id]
      }

      if (!warehouse) {
        const config = configsByClientId[invoice.client_account_id]
        const assigned = config?.assigned_warehouse
        if (assigned) {
          const assignedKey = assigned.toLowerCase()
          warehouse =
            warehouseEntitiesById[assigned] ??
            warehousesByName[assignedKey]
        }
      }

      const bucket = ensureBucket(warehouse, invoice)
      const amount = invoiceAmount(invoice)

      bucket.total += amount
      bucket.currency = invoice.currency ?? bucket.currency

      const statusKey = invoice.status.toLowerCase()
      if (statusKey === 'draft' || statusKey === 'open' || statusKey === 'overdue') {
        bucket[statusKey] += 1
      }
    })

    return Object.values(summaries)
  }, [
    upcomingInvoices,
    warehouseEntitiesById,
    warehousesByAccountId,
    warehousesByName,
    configsByClientId,
  ])

  const warehouseOptions = useMemo(
    () =>
      (data?.warehouses as BillingWarehouse[] | undefined)?.map((w: BillingWarehouse) => {
        const total =
          typeof w.upcoming_total_usd === 'number'
            ? w.upcoming_total_usd
            : parseFloat(w.upcoming_total_usd ?? '0')
        const formattedTotal = isFinite(total)
          ? ` (${formatCurrency(total, 'USD')})`
          : ''
        return {
          id: w.id,
          name: `${w.name ?? 'Warehouse'}${formattedTotal}`,
        }
      }) ?? [],
    [data?.warehouses]
  )

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Billing overview, invoices, and items to review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedWarehouse} onValueChange={(value) => setSelectedWarehouse(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              {warehouseOptions.map((warehouse, idx) => (
  <SelectItem key={`whopt-${warehouse.id || idx}`} value={warehouse.id}>
    {warehouse.name}
  </SelectItem>
))}
            </SelectContent>
          </Select>
          {searchParentId && (
            <Badge variant="outline" className="whitespace-nowrap">
              Parent: {searchParentId.slice(0, 8)}…
            </Badge>
          )}
          <Link href="/billing/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <Link href="/billing/clients">
            <Button>Clients</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium">Unable to load billing data</div>
              <div className="text-xs text-destructive/80 break-all">{String(error)}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null)
                ;(async () => {
                  setLoading(true)
                  try {
                    const dashboard = await requestDashboard()
                    setData(dashboard as any)
                  } catch (err: any) {
                    console.error('[billing] dashboard retry failed:', err, {
                      message: err?.message,
                      details: err?.details,
                      hint: err?.hint,
                      code: err?.code,
                    })
                    const msg =
                      err?.message ||
                      err?.details ||
                      err?.hint ||
                      (typeof err === 'object' ? JSON.stringify(err) : String(err)) ||
                      'Failed to load billing data'
                    const code = err?.code ? ` (${err.code})` : ''
                    setError(`${msg}${code}`)
                  } finally {
                    setLoading(false)
                  }
                })()
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4 bg-white">
            <div className="text-sm text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 text-2xl font-semibold">
              {typeof kpi.value === 'number'
                ? formatCurrency(kpi.value, defaultCurrency)
                : kpi.value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.help}</div>
          </Card>
        ))}
      </section>

      <section>
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {warehouseSummaries.map((warehouse, idx) => (
  <Card key={`whsum-${warehouse.id || idx}`} className="p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold leading-tight">{warehouse.name}</div>
                    <div className="text-xs text-muted-foreground">{warehouse.location}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground">Upcoming total</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(
                      typeof warehouse.total_view === 'number' ? warehouse.total_view : warehouse.total,
                      warehouse.currency
                    )}
                  </div>
                  {typeof warehouse.total_view === 'number' && warehouse.total_view !== warehouse.total && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      From invoices: {formatCurrency(warehouse.total, warehouse.currency)}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">Draft: {warehouse.draft}</Badge>
                  <Badge>Open: {warehouse.open}</Badge>
                  <Badge variant="destructive">Overdue: {warehouse.overdue}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/billing/clients?wh=${warehouse.id}`}>
                    <Button size="sm" variant="outline">
                      Clients
                    </Button>
                  </Link>
                  <Link href={`/billing/plans?wh=${warehouse.id}`}>
                    <Button size="sm" variant="outline">
                      Catalog
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Upcoming invoices</div>
            <Link href="/billing/clients">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && filteredUpcomingInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No upcoming invoices.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredUpcomingInvoices.map((invoice: BillingInvoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">
                        {(() => {
                          const acc = accountsById[invoice.client_account_id]
                          return acc && typeof acc.name === 'string' ? acc.name : invoice.client_account_id
                        })()}
                      </td>
                      <td className="py-2 pr-3">
                        {formatPeriod(invoice.period_start, invoice.period_end)}
                      </td>
                      <td className="py-2 pr-3">
                        {formatCurrency(invoiceAmount(invoice), invoice.currency ?? defaultCurrency)}
                      </td>
                      <td className="py-2 pr-3">{invoiceStatusBadge(invoice.status)}</td>
                      <td className="py-2 text-right">
                        <Link href={`/billing/invoices/${invoice.id}`}>
                          <Button size="sm" variant="outline">
                            Open
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Unclassified items</div>
            <Link href="/billing/clients">
              <Button variant="ghost" size="sm">
                Resolve
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Estimate</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No unclassified items.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{formatDate(event.occurred_at)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="secondary" className="capitalize">
                          {classifyEvent(event.event_type)}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{eventDescription(event)}</td>
                      <td className="py-2 pr-3">
                        {formatCurrency(eventEstimate(event), eventCurrency(event))}
                      </td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="outline">
                          Classify
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
