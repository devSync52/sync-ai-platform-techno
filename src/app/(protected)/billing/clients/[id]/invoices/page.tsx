'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface InvoiceRow {
  id: string
  clientId: string
  clientName: string
  period: string
  total: number
  status: 'draft' | 'open' | 'overdue' | 'paid'
  issueDate: string
  dueDate: string
}

// Mock dataset shared across clients (filter by clientId)
const MOCK_INVOICES: InvoiceRow[] = [
  { id: 'INV-001', clientId: 'acc_dentalclean', clientName: 'Dentalclean', period: 'Sep 1–30, 2025', total: 4820.5, status: 'paid', issueDate: '2025-10-01', dueDate: '2025-10-10' },
  { id: 'INV-002', clientId: 'acc_almaki',      clientName: 'Almaki',      period: 'Sep 1–30, 2025', total: 1960,   status: 'open',  issueDate: '2025-10-03', dueDate: '2025-10-13' },
  { id: 'INV-003', clientId: 'acc_testcorp',    clientName: 'Test Corp',   period: 'Sep 1–30, 2025', total: 734.25, status: 'overdue', issueDate: '2025-09-29', dueDate: '2025-10-08' },
  { id: 'INV-004', clientId: 'acc_nova',        clientName: 'Nova Logistics', period: 'Sep 1–30, 2025', total: 1250, status: 'draft', issueDate: '2025-10-05', dueDate: '2025-10-15' },
  { id: 'INV-005', clientId: 'acc_dentalclean', clientName: 'Dentalclean', period: 'Oct 1–31, 2025', total: 5012.1, status: 'open',  issueDate: '2025-10-24', dueDate: '2025-11-03' },
]

export default function ClientInvoicesPage() {
  const { id } = useParams<{ id: string }>()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'draft' | 'open' | 'overdue' | 'paid'>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const currency = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  const rows = useMemo(() => {
    const forClient = MOCK_INVOICES.filter(i => i.clientId === String(id))
    let filtered = forClient
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
  }, [id, q, status, fromDate, toDate])

  const stats = useMemo(() => {
    const totalInvoices = rows.length
    const draft = rows.filter(r => r.status === 'draft').length
    const open = rows.filter(r => r.status === 'open').length
    const overdue = rows.filter(r => r.status === 'overdue').length
    const paid = rows.filter(r => r.status === 'paid').length
    const amount = rows.reduce((acc, r) => acc + r.total, 0)
    return { totalInvoices, draft, open, overdue, paid, amount }
  }, [rows])

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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Client Invoices</h1>
          <p className="text-sm text-muted-foreground">Invoices for <span className="font-medium">{String(id)}</span>.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/billing/clients/${id}/usage`}><Button variant="outline">Usage</Button></Link>
          <Link href={`/billing/clients/${id}/config`}><Button variant="outline">View Config</Button></Link>
          <Link href={`/billing/invoices/new`}><Button>Create Invoice</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
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
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total invoices</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalInvoices}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Open</div>
          <div className="mt-1 text-2xl font-semibold">{stats.open}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Overdue</div>
          <div className="mt-1 text-2xl font-semibold">{stats.overdue}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Paid</div>
          <div className="mt-1 text-2xl font-semibold">{stats.paid}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Amount (filtered)</div>
          <div className="mt-1 text-2xl font-semibold">{currency(stats.amount)}</div>
        </Card>
      </section>

      {/* Table */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Invoices</div>
          <Button variant="ghost" size="sm">Export CSV</Button>
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
                  <td className="py-2 pr-3">{row.dueDate}</td>
                  <td className="py-2 pr-3">{currency(row.total)}</td>
                  <td className="py-2 pr-3">{statusBadge(row.status)}</td>
                  <td className="py-2 text-right space-x-2">
                    <Link href={`/billing/invoices/${row.id}`}><Button size="sm" variant="outline">Open</Button></Link>
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