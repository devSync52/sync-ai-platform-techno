'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { supabase } from '@/lib/supabase-browser'
import { PackageSearch } from 'lucide-react'
import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'

export default function TopSellingProductsTable({ accountId }: { accountId: string }) {
  const [data, setData] = useState<{ sku: string; quantity_sold: number; total_revenue: number }[]>([])

  useEffect(() => {
    async function fetchData() {
      const lastMonthDate = subMonths(new Date(), 1)
      const from = startOfMonth(lastMonthDate).toISOString()
      const to = endOfMonth(lastMonthDate).toISOString()

      const { data, error } = await supabase
        .from('ai_sellercloud_sku_sales_per_day')
        .select('sku, quantity_sold, total_revenue')
        .eq('account_id', accountId)
        .gte('sales_date', from)
        .lte('sales_date', to)

      if (error) {
        console.error('❌ Error fetching top products:', error)
        return
      }

      const aggregated: Record<string, { quantity: number; revenue: number }> = {}

      for (const row of data || []) {
        if (!aggregated[row.sku]) {
          aggregated[row.sku] = { quantity: 0, revenue: 0 }
        }

        aggregated[row.sku].quantity += row.quantity_sold
        aggregated[row.sku].revenue += row.total_revenue
      }

      const sorted = Object.entries(aggregated)
        .map(([sku, val]) => ({
          sku,
          quantity_sold: val.quantity,
          total_revenue: val.revenue,
        }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 5)

      setData(sorted)
    }

    fetchData()
  }, [accountId])

  const monthLabel = format(subMonths(new Date(), 1), 'MMMM yyyy')

  return (
    <div className="h-full w-full bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#3f2d90]/10 text-[#3f2d90] p-2 rounded-full">
            <PackageSearch size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Top 5 Products</p>
            <p className="text-xs text-gray-500">Most sold – {monthLabel}</p>
          </div>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>SKU</TableHeader>
            <TableHeader className="text-right">Units Sold</TableHeader>
            <TableHeader className="text-right">Revenue</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.sku}>
              <TableCell>{item.sku}</TableCell>
              <TableCell className="text-right">{item.quantity_sold}</TableCell>
              <TableCell className="text-right">
                {item.total_revenue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}