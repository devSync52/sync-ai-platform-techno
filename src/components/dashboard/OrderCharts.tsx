'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { ShoppingBag, PackageCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

export default function OrderCharts() {
  const [newOrders, setNewOrders] = useState<{ hour: string; value: number; amount: number }[]>([])
  const [shippedOrders, setShippedOrders] = useState<{ hour: string; shipped: number }[]>([])
  const [showOrderCount, setShowOrderCount] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('view_all_orders')
        .select('order_date, grand_total, status')

      if (error) {
        console.error('❌ Error fetching data:', error)
        return
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const filtered = (data || []).filter((order) => {
        const date = new Date(order.order_date)
        return date >= oneDayAgo && date <= now
      })

      const byHour = filtered.reduce((acc: any[], order: any) => {
        const hour = new Date(order.order_date).getHours().toString().padStart(2, '0')
        const key = `${hour}:00`

        const amount = order.total_amount ? parseFloat(order.grand_total) : 0

        const found = acc.find((item) => item.hour === key)

        if (found) {
          found.value += 1
          found.amount += amount
          if (order.status === 3) found.shipped += 1
        } else {
          acc.push({
            hour: key,
            value: 1,
            amount,
            shipped: order.status === 3 ? 1 : 0
          })
        }

        return acc
      }, [])

      byHour.sort((a, b) => a.hour.localeCompare(b.hour))

      setNewOrders(byHour)
      setShippedOrders(byHour.map((o) => ({ hour: o.hour, shipped: o.shipped })))
    }

    fetchData()
  }, [])

  const totalOrders = newOrders.reduce((sum, o) => sum + o.value, 0)
  const totalAmount = newOrders.reduce((sum, o) => sum + o.amount, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* New Orders */}
      <div className="bg-white rounded-2xl p-5 pb-8 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-700">New Orders</h3>
          <button
            onClick={() => setShowOrderCount(!showOrderCount)}
            className="text-xs text-primary hover:underline"
          >
            {showOrderCount ? 'Show amount' : 'Show number of orders'}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="bg-primary text-white p-3 rounded-full">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {showOrderCount
                ? totalOrders
                : `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-gray-500">LAST 24 HOURS</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150} className="mt-10">
          <LineChart data={newOrders}>
            <XAxis dataKey="hour" hide />
            <YAxis hide />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3f2d90"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Shipped Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-700">Shipped Orders</h3>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="bg-green-600 text-white p-3 rounded-full">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {shippedOrders.reduce((sum, o) => sum + o.shipped, 0)}
            </p>
            <p className="text-xs text-gray-500">LAST 24 HOURS</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={100} className="mt-10">
          <LineChart data={shippedOrders}>
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