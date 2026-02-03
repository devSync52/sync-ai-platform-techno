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
  { sku: 'DEF456', name: 'Conditioner 300ml', forecastDays: 6 },
  { sku: 'JKL012', name: 'Dental Floss', forecastDays: 4 },
]

export default function ReorderForecastChart() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-4">Reorder Forecast</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Days to Stockout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.sku}>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.forecastDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}