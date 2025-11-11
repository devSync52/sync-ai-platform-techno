

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { BillingUsageOutbound } from '@/types/billing'

// --- Types
export type UsageKind = 'storage' | 'handling' | 'shipping' | 'extra'
export type UsageStatus = 'pending' | 'invoiced'

interface UsageItem {
  id: string
  raw: BillingUsageOutbound
  date: string
  kind: UsageKind
  status: UsageStatus
  orderId: string
  description: string
  serviceCode?: string
  qty: number
  unit: string
  rate: number
  subtotal: number
  source: string
  note?: string
}

const FALLBACK_SOURCE = '—'

const mapUsageKind = (serviceCode: string | null | undefined): UsageKind => {
  const code = (serviceCode ?? '').toLowerCase()
  if (code.includes('storage')) return 'storage'
  if (code.includes('inbound') || code.includes('handle')) return 'handling'
  if (code.includes('outbound') || code.includes('ship') || code.includes('pick')) return 'shipping'
  return 'extra'
}

const mapUsageStatus = (raw: string | null | undefined): UsageStatus => {
  const normalized = (raw ?? '').toLowerCase()
  return normalized === 'invoiced' ? 'invoiced' : 'pending'
}

export default function ClientUsagePage() {
  const { id } = useParams<{ id: string }>()

  // Filters
  const [period, setPeriod] = useState<'7d' | '30d' | 'this_month'>('7d')
  const [kind, setKind] = useState<'all' | UsageKind>('all')
  const [status, setStatus] = useState<'all' | UsageStatus>('all')
  const [q, setQ] = useState('')
  const [usage, setUsage] = useState<UsageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Period helpers
  const today = useMemo(() => new Date(), [])
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const periodRange = useMemo(() => {
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    let start = new Date(end)
    if (period === '7d') start = addDays(end, -6)
    else if (period === '30d') start = addDays(end, -29)
    else if (period === 'this_month') start = startOfMonth(end)
    return { start, end }
  }, [period, today])

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 10

  const currency = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    let active = true

    const loadUsage = async () => {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({
          start: fmt(periodRange.start),
          end: fmt(periodRange.end),
        })
        const url = `/api/billing/usage/outbound/${id}?${qs.toString()}`
        const response = await fetch(url, { signal: ac.signal })
        if (!response.ok) {
          const text = await response.text().catch(() => '')
          throw new Error(text || 'Failed to load usage data')
        }
        const payload: { data: BillingUsageOutbound[] } = await response.json()
        if (!active) return
        const mapped: UsageItem[] = (payload.data ?? []).map((row) => {
          const quantity = Number((row as any).quantity ?? 0)
          const rate = Number((row as any).rate_usd ?? 0)
          const amount = Number((row as any).amount_usd ?? quantity * rate)
          const occurredRaw = (row as any).occurred_at || (row as any).order_date || (row as any).snapshot_date
          const occurred = occurredRaw ? new Date(occurredRaw as string) : null
          const date = occurred ? occurred.toISOString().split('T')[0] : '—'
          const metadata = (row as any).metadata && typeof (row as any).metadata === 'object' ? ((row as any).metadata as Record<string, unknown>) : {}
          const note = typeof (metadata as any)?.note === 'string' ? (metadata as any).note : undefined
          const source =
            (row as any).source ??
            (typeof (metadata as any)?.source === 'string' ? ((metadata as any).source as string) : FALLBACK_SOURCE)
          const serviceCode = (row as any).service_code ?? (row as any).category ?? (row as any).service
          const orderId = (row as any).order_id ?? ''

          return {
            id: (row as any).id_text ?? (row as any).id ?? `usage-${Math.random().toString(36).slice(2, 10)}`,
            raw: row,
            date,
            kind: ((row as any).kind as UsageKind) ?? mapUsageKind(serviceCode),
            status: mapUsageStatus((row as any).status),
            orderId,
            description: (row as any).description ?? serviceCode ?? 'Usage item',
            serviceCode,
            qty: quantity,
            unit: (row as any).unit ?? 'unit',
            rate,
            subtotal: amount,
            source,
            note,
          }
        })
        mapped.sort((a, b) => {
          const da = new Date(a.date).getTime()
          const db = new Date(b.date).getTime()
          return db - da
        })
        setUsage(mapped)
        setPage(1)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error(err)
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load usage data')
          setUsage([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsage()
    return () => {
      active = false
      ac.abort()
    }
  }, [id, periodRange])
  const exportCsv = () => {
    const headers = ['Date','Type','Description','Qty','Unit','Rate','Subtotal','Status','Source','Note']
    const rows = filtered.map(r => [
      r.date,
      r.kind,
      (r.description || '').replaceAll('"','""'),
      r.qty,
      r.unit,
      r.rate,
      r.subtotal,
      r.status,
      (r.source || '').replaceAll('"','""'),
      (r.note || '').replaceAll('"','""'),
    ])
    const csv = [headers, ...rows]
      .map(cols => cols.map(c => (typeof c === 'string' ? `"${c}"` : String(c))).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage_${String(id)}_${fmt(periodRange.start)}_${fmt(periodRange.end)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    let rows = [...usage]
    const { start, end } = periodRange
    rows = rows.filter((row) => {
      const parsed = new Date(row.date)
      const normalized = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
      return normalized >= start && normalized <= end
    })
    if (kind !== 'all') rows = rows.filter((row) => row.kind === kind)
    if (status !== 'all') rows = rows.filter((row) => row.status === status)
    if (q.trim()) {
      const term = q.toLowerCase()
      rows = rows.filter((row) =>
        (row.orderId ?? '').toLowerCase().includes(term) ||
        (row.description ?? '').toLowerCase().includes(term) ||
        (row.source ?? '').toLowerCase().includes(term)
      )
    }
    return rows
  }, [usage, periodRange, kind, status, q])

  const summary = useMemo(() => {
    const total = filtered.reduce((acc, r) => acc + (r.subtotal || 0), 0)
    const pending = filtered.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.subtotal || 0), 0)
    const invoiced = filtered.filter(r => r.status === 'invoiced').reduce((acc, r) => acc + (r.subtotal || 0), 0)
    const byKind: Record<UsageKind, number> = { storage: 0, handling: 0, shipping: 0, extra: 0 }
    for (const r of filtered) byKind[r.kind] += (r.subtotal || 0)
    return { count: filtered.length, total, pending, invoiced, byKind }
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Details dialog
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<UsageItem | null>(null)

  const openDetails = (row: UsageItem) => {
    setSelected(row)
    setOpen(true)
  }

  const statusBadge = (s: UsageStatus) => (
    <Badge variant={s === 'pending' ? 'default' : 'secondary'} className="capitalize">{s}</Badge>
  )
  const kindBadge = (k: UsageKind) => (
    <Badge variant="outline" className="capitalize">{k}</Badge>
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
          <p className="text-sm text-muted-foreground">Launches and consumption for <span className="font-medium">{String(id)}</span>.</p>
        </div>
      <div className="flex gap-2">
        <Link href={`/billing/clients/${id}/invoices`}><Button variant="outline">Invoices</Button></Link>
        <Link href={`/billing/clients/${id}/config`}><Button variant="outline">View Config</Button></Link>
      </div>
    </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Search</Label>
            <Input placeholder="Search description…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Period</Label>
            <Select value={period} onValueChange={(v: '7d' | '30d' | 'this_month') => setPeriod(v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={kind} onValueChange={(v: 'all' | UsageKind) => setKind(v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="handling">Handling</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="extra">Extra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v: 'all' | UsageStatus) => setStatus(v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => setPage(1)}>Apply</Button>
          </div>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-medium">Financial summary (selected period)</div>
          <div className="text-xs text-muted-foreground">
            Showing {summary.count} items • Period: {period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'This month'}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">{loading ? '—' : currency(summary.total)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-lg font-semibold">{loading ? '—' : currency(summary.pending)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Invoiced</div>
            <div className="text-lg font-semibold">{loading ? '—' : currency(summary.invoiced)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">By type</div>
            <div className="text-sm flex flex-wrap gap-3 mt-1">
              <span>Storage: <span className="font-medium">{loading ? '—' : currency(summary.byKind.storage)}</span></span>
              <span>Handling: <span className="font-medium">{loading ? '—' : currency(summary.byKind.handling)}</span></span>
              <span>Shipping: <span className="font-medium">{loading ? '—' : currency(summary.byKind.shipping)}</span></span>
              <span>Extra: <span className="font-medium">{loading ? '—' : currency(summary.byKind.extra)}</span></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Usage Items</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>Export CSV</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Order ID</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3">Rate</th>
                <th className="py-2 pr-3">Subtotal</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted-foreground">Loading…</td>
                </tr>
              )}
              {!loading &&
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{row.date === '—' ? '—' : new Date(row.date).toLocaleDateString()}</td>
                <td className="py-2 pr-3">{kindBadge(row.kind)}</td>
                <td className="py-2 pr-3">{row.orderId || '—'}</td>
                <td className="py-2 pr-3">{row.qty}</td>
                <td className="py-2 pr-3">{row.unit}</td>
                <td className="py-2 pr-3">{currency(row.rate)}</td>
                <td className="py-2 pr-3">{currency(row.subtotal)}</td>
                <td className="py-2 pr-3">{statusBadge(row.status)}</td>
                <td className="py-2 text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openDetails(row)}>Details</Button>
                  <Button size="sm" variant="outline">Mark Reviewed</Button>
                </td>
                  </tr>
                ))}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted-foreground">No items found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usage item details</DialogTitle>
            <DialogDescription>Review the origin and notes for this entry.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">{selected.date}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Type</div>
                  <div>{kindBadge(selected.kind)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Quantity</div>
                  <div className="font-medium">{selected.qty} {selected.unit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rate</div>
                  <div className="font-medium">{currency(selected.rate)}</div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Description</div>
                <div className="font-medium">{selected.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Order ID</div>
                  <div className="font-medium break-all">{selected.orderId || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Service Code</div>
                  <div className="font-medium break-all">{selected.serviceCode || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="font-medium">{currency(selected.subtotal)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>{statusBadge(selected.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Source</div>
                  <div className="font-medium">{selected.source || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Note</div>
                  <div className="font-medium">{selected.note || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
