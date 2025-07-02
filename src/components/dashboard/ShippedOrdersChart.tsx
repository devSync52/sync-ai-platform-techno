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

export default function ShippedOrdersChart() {
  const [data, setData] = useState<{ hour: string; shipped: number }[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('ai_orders_unified_4')
        .select('order_date, shipping_status')

      if (error) {
        console.error('❌ Error fetching shipped orders:', error)
        return
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const filtered = (data || []).filter((order) => {
        const date = new Date(order.order_date)
        return date >= oneDayAgo && date <= now
      })

      const byHour = filtered.reduce((acc: { hour: string; shipped: number }[], order) => {
        const date = new Date(order.order_date)
        const hour = date.getHours().toString().padStart(2, '0')
        const key = `${hour}:00`

        const isShipped = Number(order.shipping_status) === 3

        const existing = acc.find((item) => item.hour === key)

        if (existing) {
          if (isShipped) existing.shipped += 1
        } else {
          acc.push({
            hour: key,
            shipped: isShipped ? 1 : 0,
          })
        }

        return acc
      }, [])

      byHour.sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
      setData(byHour)
    }

    fetchData()
  }, [])

  const totalShipped = data.reduce((sum, d) => sum + d.shipped, 0)

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 text-green-600 p-2 rounded-full">
            <PackageCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Shipped Orders</p>
            <p className="text-xl font-bold text-green-600">{totalShipped}</p>
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </div>
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
              dataKey="shipped"
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