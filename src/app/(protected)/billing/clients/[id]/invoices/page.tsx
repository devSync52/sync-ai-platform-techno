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
  total: number
  status: 'draft' | 'open' | 'overdue' | 'paid'
  issueDate: string
  dueDate: string | null
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
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)

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

      setInvoices(json.data as InvoiceRow[])
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
  }, [id])

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

  const currency = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

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
        setIsPeriodModalOpen(false)
      }}
      disabled={isCreating}
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
                <th className="py-2 pr-3">Issue Date</th>
                <th className="py-2 pr-3">Due Date</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{row.id}</td>
                  <td className="py-2 pr-3">{row.period}</td>
                  <td className="py-2 pr-3">{row.issueDate}</td>
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
