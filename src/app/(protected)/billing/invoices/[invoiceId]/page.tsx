

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams()

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice {invoiceId}</h1>
          <p className="text-sm text-muted-foreground">Detailed view of the selected invoice.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/invoices"><Button variant="outline">Back to Invoices</Button></Link>
          <Button variant="outline">Generate PDF</Button>
          <Button>Send by Email</Button>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-muted-foreground">Client</div>
            <div className="text-base font-medium">Dentalclean</div>
          </div>
          <div>
            <Badge variant="default">Open</Badge>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-muted-foreground">Period:</span> Sep 1–30, 2025</p>
            <p><span className="text-muted-foreground">Issue Date:</span> Oct 1, 2025</p>
            <p><span className="text-muted-foreground">Due Date:</span> Oct 10, 2025</p>
          </div>
          <div>
            <p><span className="text-muted-foreground">Subtotal:</span> $4,500.00</p>
            <p><span className="text-muted-foreground">Tax:</span> $320.50</p>
            <p><span className="font-medium">Total:</span> $4,820.50</p>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <Card className="p-6">
        <div className="text-sm font-medium mb-3">Invoice Items</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b">
              <tr className="text-left">
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2 pr-3">Rate</th>
                <th className="py-2 pr-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-3">Storage Usage (m³)</td>
                <td className="py-2 pr-3">10</td>
                <td className="py-2 pr-3">$300.00</td>
                <td className="py-2 pr-3">$3,000.00</td>
              </tr>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-3">Handling Operations</td>
                <td className="py-2 pr-3">4</td>
                <td className="py-2 pr-3">$150.00</td>
                <td className="py-2 pr-3">$600.00</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Transport & Delivery</td>
                <td className="py-2 pr-3">2</td>
                <td className="py-2 pr-3">$450.00</td>
                <td className="py-2 pr-3">$900.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totals and Actions */}
      <Card className="p-6 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">All values are in USD</div>
        <div className="flex gap-2">
          <Button variant="outline">Mark as Paid</Button>
          <Button variant="outline">Add Adjustment</Button>
        </div>
      </Card>
    </div>
  )
}