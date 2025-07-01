'use client'

import { Card, CardContent } from '@/components/ui/card'
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'

const data = [
  { sku: 'ABC123', name: 'Shampoo 300ml', qty: 5 },
  { sku: 'XYZ789', name: 'Toothbrush', qty: 3 },
  { sku: 'LMN456', name: 'Mouthwash', qty: 2 },
]

export default function LowStockAlertChart() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-4">Low Stock Alerts</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.sku}>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}