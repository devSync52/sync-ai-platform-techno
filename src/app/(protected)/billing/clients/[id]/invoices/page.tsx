'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ClientPageHeader } from '@/components/billing/client-page-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface InvoiceRow {
  id: string
  period: string

  // API may return totals as `total_cents` / `total` (cents) or `total_usd`.
  total: number // USD dollars (normalized in fetchInvoices)
  total_cents?: number | null
  subtotal_cents?: number | null

  // status can be more than the initial set (e.g. issued)
  status: string

  issueDate: string
  dueDate: string | null

  warehouse_id?: string | null
  warehouse_name?: string | null

  client_label?: string | null
  client_name?: string | null
  client_code?: string | null
  client_logo_url?: string | null
}

interface ClientInfo {
  label: string
  name?: string | null
  code?: string | null
  logo_url?: string | null
}

interface WarehouseOption {
  id: string
  label: string
}

function dedupInvoicesById(list: InvoiceRow[]): InvoiceRow[] {
  const map = new Map<string, InvoiceRow>()
  for (const row of list || []) {
    if (!row?.id) continue
    map.set(String(row.id), row)
  }
  return Array.from(map.values())
}

export default function ClientInvoicesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [isClientLoading, setIsClientLoading] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'draft' | 'open' | 'overdue' | 'paid'>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([])
  const [isWarehousesLoading, setIsWarehousesLoading] = useState(false)
  const [warehousesError, setWarehousesError] = useState<string | null>(null)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const warehouseMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of warehouseOptions || []) {
      if (!w?.id) continue
      map.set(String(w.id), String(w.label || w.id))
    }
    return map
  }, [warehouseOptions])
  const fetchWarehouses = async () => {
    if (!id) return
    try {
      setIsWarehousesLoading(true)
      setWarehousesError(null)

      // Preferred endpoint: returns warehouses the client is associated with
      const res = await fetch(`/api/billing/clients/${id}/warehouses`)
      if (res.ok) {
        const json = await res.json()
        const list = (json?.data || json?.warehouses || []) as any[]

        const opts: WarehouseOption[] = (list || [])
          .filter(Boolean)
          .map((w) => {
            const wid = String(w.id || w.warehouse_id)
            const name = String(w.name || w.label || w.warehouse_name || '')

            // UX: do not include city/state in the dropdown label
            const pretty = name ? name.trim() : wid

            return {
              id: wid,
              label: pretty,
            }
          })
          .filter((w) => w.id && w.id !== 'null' && w.id !== 'undefined')

        // Deduplicate by id
        const dedup = Array.from(new Map(opts.map((o) => [o.id, o])).values())
        setWarehouseOptions(dedup)

        // If a default warehouse exists, preselect it (only if nothing chosen yet)
        const def = (list || []).find((w) => Boolean(w?.is_default))
        const defId = def ? String(def.id || def.warehouse_id) : ''
        if (!warehouseId && defId) setWarehouseId(defId)

        // If there's only one warehouse, preselect it (only if nothing chosen yet)
        if (!warehouseId && dedup.length === 1) setWarehouseId(dedup[0].id)

        return
      }

      // Fallback: derive options from already-loaded invoices
      const derived = Array.from(
        new Set((invoices || []).map((r: any) => r.warehouse_id).filter(Boolean))
      ).map((wid) => ({ id: String(wid), label: `Warehouse ${String(wid).slice(0, 8)}…` }))

      setWarehouseOptions(derived)
      if (!res.ok) {
        setWarehousesError('Warehouses endpoint not available (using fallback).')
      }
    } catch (err: any) {
      console.error('Unexpected error loading warehouses', err)
      setWarehousesError(err?.message || 'Unexpected error loading warehouses')

      // Fallback: derive options from already-loaded invoices
      const derived = Array.from(
        new Set((invoices || []).map((r: any) => r.warehouse_id).filter(Boolean))
      ).map((wid) => ({ id: String(wid), label: `Warehouse ${String(wid).slice(0, 8)}…` }))

      setWarehouseOptions(derived)
    } finally {
      setIsWarehousesLoading(false)
    }
  }

  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchInvoices = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      setLoadError(null)
      const res = await fetch(`/api/billing/clients/${id}/invoices`)
      const json = await res.json()

      if (!res.ok || !json?.success) {
        console.error('Failed to load invoices', json)
        setLoadError(json?.message || 'Failed to load invoices')
        return
      }

      const raw = (json.data || []) as any[]

      // Normalize to the shape the UI expects
      const normalized: InvoiceRow[] = raw
        .filter(Boolean)
        .map((r) => {
          // We can receive totals in a few shapes:
          // - total_cents/subtotal_cents/... as cents
          // - total_usd as dollars
          // - total as dollars (sometimes serialized as string)
          // To avoid the "$44.60" bug (double-dividing), treat any value with a decimal
          // point as dollars, not cents.

          const centsRaw =
            r.total_cents ??
            r.totalCents ??
            r.total_amount_cents ??
            r.subtotal_cents ??
            r.subtotalCents ??
            null

          const totalUsdRaw =
            typeof r.total_usd === 'string' || typeof r.total_usd === 'number'
              ? Number(r.total_usd)
              : null

          const totalDirectRaw = r.total ?? null

          const parseDollarsMaybe = (v: unknown): number | null => {
            if (v == null) return null
            if (typeof v === 'number') return Number.isFinite(v) ? v : null
            if (typeof v !== 'string') return null
            const s = v.trim()
            if (!s) return null
            // If it looks like dollars already (has decimals), don't divide by 100.
            if (s.includes('.')) {
              const n = Number(s)
              return Number.isFinite(n) ? n : null
            }
            // Otherwise assume cents.
            const n = Number(s)
            return Number.isFinite(n) ? n / 100 : null
          }

          let total = 0

          // Priority: explicit USD -> explicit cents -> generic `total`
          if (totalUsdRaw != null && Number.isFinite(totalUsdRaw)) {
            total = totalUsdRaw
          } else if (centsRaw != null) {
            if (typeof centsRaw === 'number') {
              total = Number.isFinite(centsRaw) ? centsRaw / 100 : 0
            } else if (typeof centsRaw === 'string') {
              total = parseDollarsMaybe(centsRaw) ?? 0
            } else {
              total = 0
            }
          } else {
            const parsed = parseDollarsMaybe(totalDirectRaw)
            if (parsed != null) {
              total = parsed
            } else if (typeof totalDirectRaw === 'number') {
              total = Number.isFinite(totalDirectRaw) ? totalDirectRaw : 0
            } else {
              total = 0
            }
          }

          return {
            id: String(r.id),
            period: String(r.period ?? ''),
            total,
            total_cents: centsRaw != null ? Number(centsRaw) : null,
            subtotal_cents: r.subtotal_cents != null ? Number(r.subtotal_cents) : null,
            status: String(r.status ?? 'draft'),
            issueDate: String(r.issue_date ?? r.issueDate ?? r.created_at ?? ''),
            dueDate: (r.due_date ?? r.dueDate ?? null) as string | null,
            warehouse_id: (r.warehouse_id ?? r.warehouseId ?? null) as string | null,
            warehouse_name: (r.warehouse_name ?? r.warehouseName ?? null) as string | null,
            client_label: (r.client_label ?? null) as string | null,
            client_name: (r.client_name ?? null) as string | null,
            client_code: (r.client_code ?? null) as string | null,
            client_logo_url: (r.client_logo_url ?? null) as string | null,
          }
        })

      setInvoices(dedupInvoicesById(normalized))
    } catch (err: any) {
      console.error('Unexpected error loading invoices', err)
      setLoadError(err?.message || 'Unexpected error loading invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClientInfo = async () => {
    if (!id) return
    try {
      setIsClientLoading(true)
      setClientError(null)

      const res = await fetch(`/api/billing/clients/${id}`)
      const json = await res.json()

      if (!res.ok) {
        console.error('Failed to load client info', json)
        setClientError(json?.message || 'Failed to load client info')
        return
      }

      const c = json.client || json.data || json
      if (!c) return

      const label = c.client_label || c.name || c.client_name || c.client_code || String(id)

      setClientInfo({
        label,
        name: c.name ?? c.client_name ?? null,
        code: c.client_code ?? c.code ?? null,
        logo_url: c.client_logo_url ?? c.logo_url ?? null,
      })
    } catch (err: any) {
      console.error('Unexpected error loading client info', err)
      setClientError(err?.message || 'Unexpected error loading client info')
    } finally {
      setIsClientLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchClientInfo()
    fetchWarehouses()
  }, [id])

  // Auto-refresh when returning to this tab/page so totals reflect edits
  useEffect(() => {
    const onFocus = () => {
      fetchInvoices()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchInvoices()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (isPeriodModalOpen) {
      fetchWarehouses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPeriodModalOpen])

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return
    }
    try {
      const res = await fetch(`/api/billing/invoice/${invoiceId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        console.error('Failed to delete invoice', json)
        alert(json?.message || 'Failed to delete invoice')
        return
      }
      await fetchInvoices()
    } catch (err: any) {
      console.error('Unexpected error deleting invoice', err)
      alert(err?.message || 'Unexpected error deleting invoice')
    }
  }

  const currency = (v: number) =>
    Number.isFinite(v)
      ? v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : (0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  const rows = useMemo(() => {
    let filtered = invoices
    if (status !== 'all') filtered = filtered.filter(r => r.status === status)
    if (q.trim()) {
      const t = q.toLowerCase()
      filtered = filtered.filter(r => r.id.toLowerCase().includes(t) || r.period.toLowerCase().includes(t))
    }
    if (fromDate) {
      const from = new Date(fromDate)
      filtered = filtered.filter(r => new Date(r.issueDate) >= from)
    }
    if (toDate) {
      const to = new Date(toDate)
      // include the whole day for the upper bound
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter(r => new Date(r.issueDate) <= to)
    }
    return filtered
  }, [invoices, q, status, fromDate, toDate])

  const stats = useMemo(() => {
    const totalInvoices = rows.length
    const draft = rows.filter(r => r.status === 'draft').length
    const open = rows.filter(r => r.status === 'open').length
    const overdue = rows.filter(r => r.status === 'overdue').length
    const paid = rows.filter(r => r.status === 'paid').length
    const amount = rows.reduce((acc, r) => acc + r.total, 0)
    return { totalInvoices, draft, open, overdue, paid, amount }
  }, [rows])

  const handleCreateInvoice = async () => {
    if (!periodStart || !periodEnd) {
      alert('Please select a billing period (start and end dates).')
      return
    }
    if (isWarehousesLoading) {
      alert('Please wait for warehouses to finish loading.')
      return
    }

    // One invoice per warehouse (required)
    if (!warehouseId?.trim()) {
      alert('Please select a warehouse.')
      return
    }

    setIsCreating(true)
    try {
      const parentAccountId = '80dddf96-059f-4d4a-86f0-69443ceb0db9'
      const clientAccountId = String(id)
      const res = await fetch('/api/billing/invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_account_id: parentAccountId,
          client_account_id: clientAccountId,
          warehouse_id: warehouseId.trim(),
          period_start: periodStart,
          period_end: periodEnd,
          currency_code: 'USD',
        }),
      })

      const json = await res.json()

      if (!res.ok || !json?.success) {
        console.error('Failed to create invoice', json)
        alert(json?.message || 'Failed to create invoice')
        return
      }

      const newId: string | undefined = json.data?.invoice_id || json.invoice_id

      if (!newId) {
        console.warn('Invoice created but no ID returned, reloading list as fallback.')
      }

      // Após criar, só recarrega a lista e continua na página
      await fetchInvoices()
      setPeriodStart('')
      setPeriodEnd('')
      setWarehouseId('')
      setIsPeriodModalOpen(false)
    } catch (err: any) {
      console.error('Unexpected error creating invoice', err)
      alert(err?.message || 'Unexpected error creating invoice')
    } finally {
      setIsCreating(false)
    }
  }

  const statusBadge = (s: InvoiceRow['status']) => {
    const map: Record<InvoiceRow['status'], string> = {
      draft: 'outline',
      open: 'default',
      overdue: 'destructive',
      paid: 'secondary',
    }
    // @ts-ignore shadcn Badge variants allow these presets
    return <Badge variant={map[s]} className="capitalize">{s}</Badge>
  }

  const effectiveClientLabel =
    clientInfo?.label ||
    (invoices[0] as any)?.client_label ||
    invoices[0]?.client_name ||
    invoices[0]?.client_code ||
    String(id)

  const effectiveClientLogo =
    clientInfo?.logo_url ||
    (invoices[0] as any)?.client_logo_url ||
    (invoices[0] as any)?.logo_url ||
    null

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <ClientPageHeader
        clientLabel={effectiveClientLabel}
        clientLogo={effectiveClientLogo || undefined}
        title={`Invoices for ${effectiveClientLabel}`}
        subtitle="View and manage all invoices for this client."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2">
              <Link href={`/billing/clients/${id}/usage`}>
                <Button variant="outline">Usage</Button>
              </Link>
              <Link href={`/billing/clients/${id}/config`}>
                <Button variant="outline">View Config</Button>
              </Link>
              <Button onClick={() => setIsPeriodModalOpen(true)} disabled={isCreating}>
                {isCreating ? 'Creating…' : 'New Invoice'}
              </Button>
            </div>
          </div>
        }
      />
      <Dialog open={isPeriodModalOpen} onOpenChange={setIsPeriodModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              Choose the billing period you want to generate an invoice for.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Warehouse</Label>

              <Select value={warehouseId || undefined} onValueChange={(v) => setWarehouseId(v)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isWarehousesLoading
                        ? 'Loading warehouses…'
                        : warehouseOptions.length
                          ? 'Select a warehouse'
                          : 'No warehouses found'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-[11px] text-muted-foreground">
                Select the warehouse you want to invoice (defaults to the client’s primary warehouse when available).
              </div>
              {warehousesError && (
                <div className="text-[11px] text-muted-foreground">{warehousesError}</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Period start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Period end</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
  <div className="mt-4 flex justify-end gap-2">
    <Button
      type="button"
      variant="outline"
      onClick={() => setIsPeriodModalOpen(false)}
      disabled={isCreating}
    >
      Cancel
    </Button>
    <Button
      type="button"
      onClick={async () => {
        await handleCreateInvoice()
      }}
      disabled={
        isCreating ||
        isWarehousesLoading ||
        !warehouseId?.trim() ||
        !periodStart ||
        !periodEnd
      }
    >
      {isCreating ? 'Creating…' : 'Create invoice'}
    </Button>
  </div>
</DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Search</Label>
            <Input placeholder="Search by invoice # or period…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v: 'all' | 'draft' | 'open' | 'overdue' | 'paid') => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">From (Issue Date)</Label>
            <Input type="date" className="mt-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">To (Issue Date)</Label>
            <Input type="date" className="mt-1" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total invoices</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalInvoices}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-xs text-muted-foreground">Open</div>
          <div className="mt-1 text-2xl font-semibold">{stats.open}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-xs text-muted-foreground">Overdue</div>
          <div className="mt-1 text-2xl font-semibold">{stats.overdue}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-xs text-muted-foreground">Paid</div>
          <div className="mt-1 text-2xl font-semibold">{stats.paid}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-xs text-muted-foreground">Amount (filtered)</div>
          <div className="mt-1 text-2xl font-semibold">{currency(stats.amount)}</div>
        </Card>
      </section>

      {/* Table */}
      <Card className="p-4 bg-white">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xl font-medium">Invoices</div>
          <Button variant="ghost" size="sm">Export CSV</Button>
        </div>
        <div className="mb-2 text-xs text-muted-foreground">
          {isLoading && <span>Loading invoices…</span>}
          {!isLoading && loadError && <span className="text-destructive">Error: {loadError}</span>}
          {clientError && (
            <span className="ml-2 text-destructive">Client info: {clientError}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Invoice #</th>
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Warehouse</th>
                <th className="py-2 pr-3">Due Date</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium" title={row.id}>
                    {String(row.id).slice(0, 8)}
                  </td>
                  <td className="py-2 pr-3">{row.period}</td>
                  <td className="py-2 pr-3">
                    {(() => {
                      const rawLabel =
                        row.warehouse_name ||
                        warehouseMap.get(String(row.warehouse_id || '')) ||
                        (row.warehouse_id ? `${String(row.warehouse_id).slice(0, 8)}…` : '-')

                      // Strip optional trailing location in parentheses
                      return String(rawLabel).replace(/\s*\([^)]*\)\s*$/, '')
                    })()}
                  </td>
                  <td className="py-2 pr-3">{row.dueDate || '-'}</td>
                  <td className="py-2 pr-3">{currency(row.total)}</td>
                  <td className="py-2 pr-3">{statusBadge(row.status)}</td>
                  <td className="py-2 text-right space-x-2">
                    <Link href={`/billing/invoices/${row.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteInvoice(row.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">No invoices found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
