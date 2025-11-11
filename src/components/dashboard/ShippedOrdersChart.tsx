'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase-browser'
import { PackageCheck } from 'lucide-react'

export default function ShippedOrdersChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const [data, setData] = useState<{ hour: string; shipped: number; total_items: number }[]>([])
  const [showItems, setShowItems] = useState(false)
  const [period, setPeriod] = useState<'24h' | '7d' | '31d' | '3m'>('7d')
  const [totals, setTotals] = useState<{ orders: number; items: number }>({ orders: 0, items: 0 })

  useEffect(() => {
    async function fetchData() {
      const now = new Date()
      const nowUTC = new Date(now.toISOString())

      let startDate: Date
      switch (period) {
        case '24h':
          startDate = new Date(nowUTC.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(nowUTC.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '31d':
          startDate = new Date(nowUTC.getTime() - 31 * 24 * 60 * 60 * 1000)
          break
        case '3m':
          startDate = new Date(nowUTC)
          startDate.setMonth(startDate.getMonth() - 3)
          break
        default:
          startDate = new Date(nowUTC.getTime() - 24 * 60 * 60 * 1000)
      }

      // Build filters once
      const baseFilters = (qb: any) => {
        qb = qb
          .gte('order_date', startDate.toISOString())
          .lte('order_date', nowUTC.toISOString())
          .eq('shipping_status', 3)
        if (userRole === 'client' || userRole === 'staff-client') {
          qb = qb.eq('channel_account_id', userAccountId)
        } else {
          qb = qb.eq('account_id', userAccountId)
        }
        return qb
      }

      // Base select for series
      let query = baseFilters(
        supabase
          .from('ai_shipping_info_sc_v2')
          .select('order_date, shipping_status, items_count')
      )

      // ---- Pagination to bypass PostgREST 1k page cap ----
      const pageSize = 1000
      let from = 0
      let allRows: { order_date: string; shipping_status: number; items_count: number }[] = []

      while (true) {
        const { data: page, error } = await query
          .order('order_date', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) {
          console.error('❌ Error fetching shipped orders (page):', {
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
        from += pageSize
      }
      // ----------------------------------------------------

      // Accurate totals (orders via count head:true; items via sum of all pages)
      const itemsSum = (allRows || []).reduce((sum, r) => sum + (Number(r.items_count) || 0), 0)
      const { count: ordersCount, error: countError } = await baseFilters(
        supabase.from('ai_shipping_info_sc_v2').select('*', { count: 'exact', head: true })
      )
      if (countError) {
        console.warn('⚠️ Count fallback to client length due to error:', countError)
      }
      setTotals({ orders: ordersCount ?? allRows.length, items: itemsSum })

      // Group per hour for chart
      const byHour = (allRows || []).reduce((acc: { hour: string; shipped: number; total_items: number }[], order) => {
        const date = new Date(order.order_date)
        let hour = date.getHours()
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12
        hour = hour ? hour : 12
        const key = `${hour} ${ampm}`

        const itemsCount = Number(order.items_count) || 0
        const existing = acc.find((item) => item.hour === key)

        if (existing) {
          existing.shipped += 1
          existing.total_items += itemsCount
        } else {
          acc.push({
            hour: key,
            shipped: 1,
            total_items: itemsCount,
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

      console.log('📦 Raw data from Supabase (allRows):', allRows)
      console.log('📦 Grouped by hour:', byHour)

      setData(byHour)
    }

    fetchData()
  }, [userRole, userAccountId, period])

  const totalShipped = totals.orders
  const totalItems = totals.items

  const periodLabel = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '31d': 'Last 31 days',
    '3m': 'Last 3 months',
  }[period]

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 text-green-600 p-2 rounded-full">
            <PackageCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Shipped</p>
            <p className="text-xl font-bold text-green-600">{totalShipped} Orders / {totalItems} Items</p>
            <p className="text-xs text-gray-500">{periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* <button
            onClick={() => setShowItems(!showItems)}
            className="text-xs text-green-600 underline hover:text-green-800 transition"
          >
            {showItems ? 'Show Orders' : 'Show Items'}
          </button> */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '24h' | '7d' | '31d' | '3m')}
            className="text-xs flex mt-1 items-center gap-1 text-green-600 border px-2 py-1 rounded-md hover:bg-muted"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="31d">Last 31 days</option>
            <option value="3m">Last 3 months</option>
          </select>
        </div>
      </div>
      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" hide />
            <YAxis hide />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={showItems ? 'total_items' : 'shipped'}
              stroke="#17a34a"
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