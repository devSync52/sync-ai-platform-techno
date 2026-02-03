'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'
import { format } from 'date-fns'

export default function SalesVsPreviousMonthChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const [data, setData] = useState<{ month: string; total: number; orders: number }[]>([])
  const [showOrderCount, setShowOrderCount] = useState(false)

  useEffect(() => {
    async function fetchMonthlyData(monthOffset: number, userRole: string, userAccountId: string) {
      const now = new Date()
      const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const label = format(month, 'MMMM')

      const start = new Date(month.getFullYear(), month.getMonth(), 1)
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      let query = supabase
        .from('view_all_orders_v3')
        .select('grand_total')
        .gte('order_date', start.toISOString().slice(0, 10))
        .lte('order_date', end.toISOString().slice(0, 10))

      if (userRole === 'client' || userRole === 'staff-client') {
        query = query.eq('channel_account_id', userAccountId)
      } else {
        query = query.eq('account_id', userAccountId)
      }

      const { data, error } = await query

      if (error) {
        console.error(`❌ Error fetching data for ${label}:`, error)
        return { month: label, total: 0, orders: 0 }
      }

      const total = data.reduce((sum, o) => sum + (o.grand_total || 0), 0)
      return { month: label, total, orders: data.length }
    }

    async function fetchAll() {
      const months = await Promise.all([
        fetchMonthlyData(0, userRole, userAccountId),
        fetchMonthlyData(1, userRole, userAccountId),
        fetchMonthlyData(2, userRole, userAccountId),
      ])
      setData(months.reverse()) // Para mostrar do mais antigo ao atual
    }

    fetchAll()
  }, [userRole, userAccountId])

  const totalValue = data.reduce((sum, d) => sum + (showOrderCount ? d.orders : d.total), 0)

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#3f2d90]/10 text-[#3f2d90] p-2 rounded-full">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Sales (Last 3 months)</p>
            <p className="text-xl font-bold text-[#3f2d90]">
              {showOrderCount
                ? `${totalValue} Orders`
                : totalValue.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
            </p>
            <p className="text-xs text-gray-500">Comparing last 3 months</p>
          </div>
        </div>

      </div>
      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) =>
                showOrderCount
                  ? `${value} orders`
                  : value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })
              }
            />
            <Bar
              dataKey={showOrderCount ? 'orders' : 'total'}
              fill="#3f2d90"
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}