

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InvoiceMock {
  id: string
  client: string
  period: string
  total: number
  status: 'draft' | 'open' | 'overdue' | 'paid'
  issueDate: string
  dueDate: string
}

const mockInvoices: InvoiceMock[] = [
  { id: 'INV-001', client: 'Dentalclean', period: 'Sep 1–30, 2025', total: 4820.5, status: 'paid', issueDate: '2025-10-01', dueDate: '2025-10-10' },
  { id: 'INV-002', client: 'Almaki', period: 'Sep 1–30, 2025', total: 1960, status: 'open', issueDate: '2025-10-03', dueDate: '2025-10-13' },
  { id: 'INV-003', client: 'Test Corp', period: 'Sep 1–30, 2025', total: 734.25, status: 'overdue', issueDate: '2025-09-29', dueDate: '2025-10-08' },
  { id: 'INV-004', client: 'Nova Logistics', period: 'Sep 1–30, 2025', total: 1250, status: 'draft', issueDate: '2025-10-05', dueDate: '2025-10-15' }
]

export default function InvoicesPage() {
  const [invoices] = useState(mockInvoices)
  const currency = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  const statusBadge = (s: InvoiceMock['status']) => {
    const map: Record<InvoiceMock['status'], string> = {
      draft: 'outline',
      open: 'default',
      overdue: 'destructive',
      paid: 'secondary',
    }
    // @ts-ignore
    return <Badge variant={map[s]} className="capitalize">{s}</Badge>
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and review all issued invoices.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing"><Button variant="outline">Back to Billing</Button></Link>
          <Link href="/billing/invoices/new"><Button>Create Invoice</Button></Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Invoice List</div>
          <Button variant="ghost" size="sm">Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left border-b">
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
                  <td className="py-2 pr-3">{row.issueDate}</td>
                  <td className="py-2 pr-3">{row.dueDate}</td>
                  <td className="py-2 pr-3">{currency(row.total)}</td>
                  <td className="py-2 pr-3">{statusBadge(row.status)}</td>
                  <td className="py-2 text-right">
                    <Link href={`/billing/invoices/${row.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>


    </div>
  )
}