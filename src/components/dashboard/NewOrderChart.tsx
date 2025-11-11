'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase-browser'
import { ShoppingBag } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function NewOrdersChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const [data, setData] = useState<{ hour: string; value: number; amount: number }[]>([])
  const [showOrderCount, setShowOrderCount] = useState(false)
  const [period, setPeriod] = useState<'7d' | '24h' | '31d' | '3m'>('7d')
  const [totals, setTotals] = useState<{ orders: number; amount: number }>({ orders: 0, amount: 0 })

  useEffect(() => {
    async function fetchData() {
      const now = new Date()
      let from = new Date()
      switch (period) {
        case '7d': from.setDate(now.getDate() - 7); break
        case '31d': from.setDate(now.getDate() - 31); break
        case '3m': from.setMonth(now.getMonth() - 3); break
        default: from.setDate(now.getDate() - 1)
      }

      // Build filters once
      const baseFilters = (qb: any) => {
        qb = qb
          .gte('order_date', from.toISOString())
          .lte('order_date', now.toISOString())
        if (userRole === 'client' || userRole === 'staff-client') {
          qb = qb.eq('channel_account_id', userAccountId)
        } else {
          qb = qb.eq('account_id', userAccountId)
        }
        return qb
      }

      // Base select for series
      let query = baseFilters(
        supabase.from('view_all_orders_v2').select('order_date, grand_total')
      )

      // ---- Pagination to bypass PostgREST 1k page cap ----
      const pageSize = 1000
      let start = 0
      let allRows: { order_date: string; grand_total: any }[] = []

      while (true) {
        const { data: page, error } = await query
          .order('order_date', { ascending: true })
          .range(start, start + pageSize - 1)

        if (error) {
          console.error('❌ Error fetching new orders (page):', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
          })
          break
        }

        if (!page || page.length === 0) break

        allRows = allRows.concat(page as any)

        if (page.length < pageSize) break
        start += pageSize
      }
      // ----------------------------------------------------

      // Accurate totals:
      // - orders via PostgREST count (head:true) so it ignores the 1k page cap
      // - amount via client-side sum over all pages
      const amountSum = (allRows || []).reduce((sum, r) => {
        const v = typeof r.grand_total === 'number' ? r.grand_total : parseFloat(r.grand_total ?? '0')
        return sum + (isNaN(v) ? 0 : v)
      }, 0)
      const { count: ordersCount, error: countError } = await baseFilters(
        supabase.from('ai_orders_unified_4').select('*', { count: 'exact', head: true })
      )
      if (countError) {
        console.warn('⚠️ Count fallback to client length due to error:', countError)
      }
      setTotals({ orders: ordersCount ?? allRows.length, amount: amountSum })

      // Group per hour for chart
      const byHour = (allRows || []).reduce((acc: any[], order: any) => {
        const dateObj = new Date(order.order_date)
        let hour = dateObj.getHours()
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12
        hour = hour ? hour : 12 // the hour '0' should be '12'
        const key = `${hour} ${ampm}`
        const amount = order.grand_total ? parseFloat(order.grand_total) : 0

        const found = acc.find((item) => item.hour === key)

        if (found) {
          found.value += 1
          found.amount += amount
        } else {
          acc.push({
            hour: key,
            value: 1,
            amount,
          })
        }

        return acc
      }, [])

      // Sort by hour in 24-hour format for correct ordering
      byHour.sort((a, b) => {
        const parseHour = (h: string) => {
          const [num, ampm] = h.split(' ')
          let n = parseInt(num)
          if (ampm === 'AM') {
            return n === 12 ? 0 : n
          } else {
            return n === 12 ? 12 : n + 12
          }
        }
        return parseHour(a.hour) - parseHour(b.hour)
      })

      console.log('🛒 New orders raw (allRows):', allRows)
      console.log('🛒 New orders grouped by hour:', byHour)

      setData(byHour)
    }

    fetchData()
  }, [userRole, userAccountId, period])

  const totalValue = showOrderCount ? totals.orders : totals.amount

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#3f2d90]/10 text-[#3f2d90] p-2 rounded-full">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">New Orders</p>
            <p className="text-xl font-bold text-[#3f2d90]">
              {showOrderCount
                ? `${totalValue} Orders`
                : totalValue.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
            </p>
            <p className="text-xs text-gray-500">
              {{
                '24h': 'Last 24 hours',
                '7d': 'Last 7 days',
                '31d': 'Last 31 days',
                '3m': 'Last 3 months',
              }[period]}
            </p>
          </div>
        </div>
        <div className="relative z-50" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              console.log('🔁 Toggle clicked:', !showOrderCount)
              setShowOrderCount(!showOrderCount)
            }}
            className="text-xs text-primary underline"
          >
            {showOrderCount ? 'Show value' : 'Show number of orders'}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs flex mt-1 items-center gap-1 text-primary border px-2 py-1 rounded-md hover:bg-muted">
                {{
                  '24h': 'Last 24 hours',
                  '7d': 'Last 7 days',
                  '31d': 'Last 31 days',
                  '3m': 'Last 3 months',
                }[period]}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPeriod('24h')}>Last 24 hours</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('7d')}>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('31d')}>Last 31 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('3m')}>Last 3 months</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="h-[200px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
  <LineChart
    key={showOrderCount ? 'orders' : 'value'} 
    data={data}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="hour" hide />
    <YAxis hide />
    <Tooltip
      formatter={(value: number) =>
        showOrderCount
          ? [`${value} orders`, 'Orders']
          : [value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), 'Sales']
      }
    />
    <Line
      type="monotone"
      dataKey={showOrderCount ? 'value' : 'amount'}
      stroke="#3f2d90"
      strokeWidth={3}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
      </div>
    </div>
  )
}