'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InvoiceRow {
  id: string
  client: string
  period: string
  total: number
  status: string
  issueDate: string | null
  dueDate: string | null
}

function formatCurrency(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr // fallback bruto
  return d.toLocaleDateString('en-US')
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  const map: Record<string, 'outline' | 'default' | 'destructive' | 'secondary'> = {
    draft: 'outline',
    open: 'default',
    issued: 'default',
    overdue: 'destructive',
    paid: 'secondary',
  }

  const variant = map[normalized] ?? 'outline'

  return (
    <Badge variant={variant} className="capitalize">
      {normalized}
    </Badge>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/billing/invoice')
        if (!res.ok) {
          throw new Error('Failed to load invoices')
        }

        const payload: { data: InvoiceRow[] } = await res.json()
        if (!active) return

        setInvoices(payload.data ?? [])
      } catch (err) {
        console.error('[billing/invoice] load error:', err)
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to load invoices'
          )
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
            Manage and review all issued invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Back to Billing</Button>
          </Link>
          
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Invoice List</div>
          <Button variant="ghost" size="sm">
            Export CSV
          </Button>
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
                  <th className="py-2 pr-3">Client</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Issue Date</th>
                  <th className="py-2 pr-3">Due Date</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{row.id}</td>
                    <td className="py-2 pr-3">{row.client}</td>
                    <td className="py-2 pr-3">{row.period}</td>
                    <td className="py-2 pr-3">{formatDate(row.issueDate)}</td>
                    <td className="py-2 pr-3">{formatDate(row.dueDate)}</td>
                    <td className="py-2 pr-3">
                      {formatCurrency(row.total ?? 0)}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/billing/invoices/${row.id}`}>
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
        )}
      </Card>
    </div>
  )
}