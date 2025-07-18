'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase-browser'
import { CalendarDays } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, addDays } from 'date-fns'

interface MonthOption {
  label: string
  start: string
  end: string
}

const getLastThreeMonths = (): MonthOption[] => {
  return [0, 1, 2].map(offset => {
    const date = subMonths(new Date(), offset)
    return {
      label: format(date, 'MMMM yyyy'),
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd'),
    }
  })
}

export default function OrdersPerDayChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const monthOptions = getLastThreeMonths()
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(monthOptions[0])
  const [data, setData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    async function fetchOrders() {
      const { start, end } = selectedMonth

      let allOrders: { order_date: string }[] = []
      const limit = 1000
      let from = 0
      let to = limit - 1
      let more = true

      while (more) {
        let query = supabase
          .from('view_all_orders_v3')
          .select('order_date')
          .gte('order_date', start)
          .lt('order_date', addDays(new Date(end), 1).toISOString().split('T')[0])
          .range(from, to)

        if (userRole === 'client') {
          query = query.eq('channel_account_id', userAccountId)
        } else {
          query = query.eq('account_id', userAccountId)
        }

        const { data, error } = await query

        if (error) {
          console.error('❌ Error fetching orders:', error)
          break
        }

        allOrders = [...allOrders, ...(data || [])]

        if ((data?.length || 0) < limit) {
          more = false
        } else {
          from += limit
          to += limit
        }
      }

      const dailyCounts: Record<string, number> = {}
      for (const order of allOrders) {
        const date = order.order_date?.split('T')[0]
        if (date) {
          dailyCounts[date] = (dailyCounts[date] || 0) + 1
        }
      }

      const chartData = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setData(chartData)
      console.log('🟢 OrdersPerDayChart Debug')
      console.log('🟢 Total fetched orders:', allOrders.length)
      console.log('🟢 Unique counted:', chartData.length)
      console.log('🟢 Daily grouped orders:', chartData)
    }

    fetchOrders()
  }, [selectedMonth, userRole, userAccountId])

  const totalOrders = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#3f2d90]/10 text-green-600 p-2 rounded-full">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Orders per Day</p>
            <p className="text-xl font-bold text-green-600">{totalOrders} Orders</p>
            <p className="text-xs text-gray-500">in {selectedMonth.label}</p>
          </div>
        </div>

        <select
          value={selectedMonth.label}
          onChange={(e) => {
            const selected = monthOptions.find(m => m.label === e.target.value)
            if (selected) setSelectedMonth(selected)
          }}
          className="border border-gray-300 text-sm rounded-md px-2 py-1"
        >
          {monthOptions.map(m => (
            <option key={m.label} value={m.label}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="count" fill="#17a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}