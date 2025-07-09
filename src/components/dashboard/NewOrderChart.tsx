'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase-browser'
import { ShoppingBag } from 'lucide-react'

export default function NewOrdersChart() {
  const [data, setData] = useState<{ hour: string; value: number; amount: number }[]>([])
  const [showOrderCount, setShowOrderCount] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('view_all_orders')
        .select('order_date, total_amount')

      if (error) {
        console.error('❌ Error fetching new orders:', error)
        return
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const filtered = (data || []).filter((order) => {
        const date = new Date(order.order_date)
        return date >= oneDayAgo && date <= now
      })

      const byHour = filtered.reduce((acc: any[], order: any) => {
        const dateObj = new Date(order.order_date)
        let hour = dateObj.getHours()
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12
        hour = hour ? hour : 12 // the hour '0' should be '12'
        const key = `${hour} ${ampm}`
        const amount = order.total_amount ? parseFloat(order.total_amount) : 0

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

      byHour.sort((a, b) => a.hour.localeCompare(b.hour))

      setData(byHour)
    }

    fetchData()
  }, [])

  const totalValue = data.reduce((sum, d) => sum + (showOrderCount ? d.value : d.amount), 0)

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
            <p className="text-xs text-gray-500">Last 24 hours</p>
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