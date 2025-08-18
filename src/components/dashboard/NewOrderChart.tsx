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

      let query = supabase
        .from('view_all_orders_v2')
        .select('order_date, grand_total')
        .gte('order_date', from.toISOString())
        .lte('order_date', now.toISOString())

      if (userRole === 'client' || userRole === 'staff-client') {
        query = query.eq('channel_account_id', userAccountId)
      } else {
        query = query.eq('account_id', userAccountId)
      }

      const { data: filtered, error } = await query

      if (error) {
        console.error('❌ Error fetching new orders:', error)
        return
      }

      const byHour = (filtered || []).reduce((acc: any[], order: any) => {
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

      byHour.sort((a, b) => a.hour.localeCompare(b.hour))

      setData(byHour)
    }

    fetchData()
  }, [userRole, userAccountId, period])

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