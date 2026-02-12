'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InvoiceRow {
  id: string
  number: string | null
  plan: {
    name: string | null
    interval: string | null
    amount: number | null
    currency: string | null
  }
  currency: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  status: string
  createdAt: string | null
  periodStart: string | null
  periodEnd: string | null
  dueDate: string | null
  downloadUrl: string | null
  payUrl: string | null
  isPaid: boolean
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

interface PlanInfo {
  id: string
  name: string
  amount: number
  interval: string | null
  currency: string
}

function formatCurrency(v: number, currency = 'USD') {
  return v.toLocaleString('en-US', { style: 'currency', currency })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US')
}

function formatPeriod(start: string | null, end: string | null) {
  const s = formatDate(start)
  const e = formatDate(end)
  if (s === '-' && e === '-') return '-'
  if (s !== '-' && e === '-') return s
  if (s === '-' && e !== '-') return e
  return `${s} - ${e}`
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase()

  const map: Record<string, 'outline' | 'default' | 'destructive' | 'secondary'> = {
    draft: 'outline',
    open: 'default',
    issued: 'default',
    uncollectible: 'destructive',
    overdue: 'destructive',
    paid: 'secondary',
    void: 'secondary',
  }

  const variant = map[normalized] ?? 'outline'

  return (
    <Badge variant={variant} className="capitalize">
      {normalized}
    </Badge>
  )
}

export default function InvoicesPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/stripe/invoices', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to load invoices')
        }

        const payload: { plan: PlanInfo | null; data: InvoiceRow[] } = await res.json()
        if (!active) return

        setPlan(payload.plan ?? null)
        setInvoices(payload.data ?? [])
      } catch (err) {
        console.error('[stripe/invoices] load error:', err)
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load invoices')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Subscription invoices from your selected pricing plan.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Current Plan</div>
          <div className="flex items-center gap-2">
            <Link href="/billing/pricing?intent=upgrade&from=invoices">
              <Button size="sm" variant="default">
                Upgrade Plan
              </Button>
            </Link>
            <Link href="/billing/pricing?intent=downgrade&from=invoices">
              <Button size="sm" variant="outline">
                Downgrade Plan
              </Button>
            </Link>
          </div>
        </div>
        {!plan && (
          <div className="pt-2 text-sm text-muted-foreground">
            No active plan found.
          </div>
        )}
        {plan && (
          <div className="pt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{plan.name}</span>
            {' · '}
            {formatCurrency(plan.amount, plan.currency)} / {plan.interval ?? 'month'}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Invoice List</div>
        </div>

        {loading && (
          <div className="py-4 text-sm text-muted-foreground">
            Loading invoices…
          </div>
        )}

        {error && !loading && (
          <div className="py-4 text-sm text-destructive">
            Unable to load invoices: {error}
          </div>
        )}

        {!loading && !error && invoices.length === 0 && (
          <div className="py-4 text-sm text-muted-foreground">
            No invoices found yet.
          </div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Invoice #</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Due Date</th>
                  <th className="py-2 pr-3">Subtotal</th>
                  <th className="py-2 pr-3">Tax</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Paid</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{row.number ?? row.id}</td>
                    <td className="py-2 pr-3">
                      {row.plan.name ?? '-'}
                      {row.plan.interval ? ` (${row.plan.interval})` : ''}
                    </td>
                    <td className="py-2 pr-3">{formatPeriod(row.periodStart, row.periodEnd)}</td>
                    <td className="py-2 pr-3">{formatDate(row.createdAt)}</td>
                    <td className="py-2 pr-3">{formatDate(row.dueDate)}</td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.subtotal ?? 0, row.currency)}
                    </td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.tax ?? 0, row.currency)}
                    </td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.total ?? 0, row.currency)}
                    </td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.amountPaid ?? 0, row.currency)}
                    </td>
                    <td className="py-2 pr-3">
                      {formatCurrency(
                        row.status.toLowerCase() === 'paid' ? 0 : (row.amountDue ?? 0),
                        row.currency
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {statusBadge(row.status)}
                    </td>
                    <td className="py-2 text-right">
                      {row.downloadUrl ? (
                        <a href={row.downloadUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </a>
                      ) : row.payUrl ? (
                        <a href={row.payUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="default">
                            Pay now
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Processing
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
