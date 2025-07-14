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
import { totalmem } from 'os'

export default function ShippedOrdersChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const [data, setData] = useState<{ hour: string; shipped: number; total_items: number }[]>([])
  const [showItems, setShowItems] = useState(false)

  useEffect(() => {
    async function fetchData() {
      let query = supabase
        .from('ai_shipping_info_sc_v2')
        .select('order_date, shipping_status, items_count')

      if (userRole === 'client') {
        query = query.eq('channel_account_id', userAccountId)
      } else {
        query = query.eq('account_id', userAccountId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching shipped orders:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        })
        return
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const filtered = (data || []).filter((order) => {
        const date = new Date(order.order_date)
        return date >= oneDayAgo && date <= now
      })

      const byHour = filtered.reduce((acc: { hour: string; shipped: number; total_items: number }[], order) => {
        const date = new Date(order.order_date)
        let hour = date.getHours()
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12
        hour = hour ? hour : 12
        const key = `${hour} ${ampm}`

        const isShipped = Number(order.shipping_status) === 3
        const itemsCount = Number(order.items_count) || 0

        const existing = acc.find((item) => item.hour === key)

        if (existing) {
          if (isShipped) {
            existing.shipped += 1
            existing.total_items += itemsCount
          }
        } else {
          acc.push({
            hour: key,
            shipped: isShipped ? 1 : 0,
            total_items: isShipped ? itemsCount : 0,
          })
        }

        return acc
      }, [])

      // Sort by hour in 24-hour format for correct ordering
      byHour.sort((a, b) => {
        // Parse hour and AM/PM for sorting
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
      setData(byHour)
    }

    fetchData()
  }, [userRole, userAccountId])

  const totalShipped = data.reduce((sum, d) => sum + d.shipped, 0)
  const totalItems = data.reduce((sum, d) => sum + d.total_items, 0)

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
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </div>
        </div>
        <button
          onClick={() => setShowItems(!showItems)}
          className="text-xs text-green-600 underline hover:text-green-800 transition"
        >
          {showItems ? 'Show Orders' : 'Show Items'}
        </button>
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