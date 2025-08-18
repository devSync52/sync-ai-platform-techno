'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Store } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns'

const COLORS = [
  '#3f2d90', '#6366f1', '#8b5cf6', '#9333ea', '#c084fc',
  '#e879f9', '#f472b6', '#fb7185', '#f59e0b', '#84cc16',
]

export default function SalesByMarketplaceChart({
  userRole,
  userAccountId,
}: {
  userRole: string
  userAccountId: string
}) {
  const [data, setData] = useState<{ marketplace: string; orders: number; logo?: string }[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const months = [
    subMonths(new Date(), 2),
    subMonths(new Date(), 1),
    new Date(),
  ]

  useEffect(() => {
    async function fetchData() {
      const from = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
      const to = format(startOfMonth(addMonths(selectedMonth, 1)), 'yyyy-MM-dd')

      let allData: { marketplace_name: string; order_date: string; logo?: string; order_id?: string; channel_account_id?: string; account_id?: string }[] = []
      const limit = 1000
      let fromIdx = 0
      let toIdx = limit - 1
      let more = true

      while (more) {
        let query = supabase
          .from('view_all_orders_v3')
          .select('marketplace_name, order_date, logo, order_id, channel_account_id, account_id')
          .gte('order_date', from)
          .lt('order_date', to)
          .range(fromIdx, toIdx)

        if (userRole === 'client' || userRole === 'staff-client') {
          query = query.eq('channel_account_id', userAccountId)
        } else {
          query = query.eq('account_id', userAccountId)
        }

        const { data, error } = await query

        if (error) {
          console.error('❌ Error fetching marketplace data:', error)
          break
        }

        allData = [...allData, ...(data || [])]

        allData = allData.filter((item) => {
          return userRole === 'client' || userRole === 'staff-client'
            ? item.channel_account_id === userAccountId
            : item.account_id === userAccountId
        })

        if ((data?.length || 0) < limit) {
          more = false
        } else {
          fromIdx += limit
          toIdx += limit
        }
      }

      const seen = new Set<string>()
      const grouped = allData.reduce((acc, curr) => {
        const rawName = curr.marketplace_name?.trim().toLowerCase()
        if (!rawName) return acc
        const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1) // ex: "amazon" -> "Amazon"
        const uniqueKey = `${curr.order_id}-${rawName}`

        if (seen.has(uniqueKey)) return acc
        seen.add(uniqueKey)

        if (!acc[normalizedName]) {
          let logo = curr.logo
          if (!logo && rawName) {
            const filename = rawName.replace(/\s+/g, '')
            logo = `/logos/${filename}.png`
          }
          acc[normalizedName] = { marketplace: normalizedName, orders: 0, logo }
        }

        acc[normalizedName].orders += 1
        return acc
      }, {} as Record<string, { marketplace: string; orders: number; logo?: string }>)

      console.log('🟪 Total fetched orders:', allData.length)
      console.log('🟪 Unique counted:', seen.size)
      console.log('🟪 Grouped orders by marketplace:', grouped)

      const result = Object.values(grouped).sort((a, b) => b.orders - a.orders)
      setData(result)
    }

    fetchData()
  }, [selectedMonth, userRole, userAccountId])

  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)

  return (
    <div className="h-full w-full bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#3f2d90]/10 text-[#3f2d90] p-2 rounded-full">
            <Store size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Orders by Marketplace</p>
            <p className="text-xl font-bold text-[#3f2d90]">{totalOrders} Orders</p>
            <p className="text-xs text-gray-500">in {format(selectedMonth, 'MMMM yyyy')}</p>
          </div>
        </div>
        <select
          className="text-sm border rounded px-2 py-1 bg-white text-gray-700"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-')
            setSelectedMonth(new Date(Number(year), Number(month) - 1))
          }}
        >
          {months.map((m) => (
            <option key={m.toISOString()} value={format(m, 'yyyy-MM')}>
              {format(m, 'MMMM yyyy')}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="orders"
              nameKey="marketplace"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={45}
              paddingAngle={5}
              labelLine={false}
              label={({ cx, cy, midAngle, outerRadius, index }) => {
                const RADIAN = Math.PI / 180
                const radius = outerRadius + 30
                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                const marketplace = data[index]?.marketplace?.toLowerCase().replace(/\s+/g, '')
                // Use logo from data if available, else fallback to filename
                const logoSrc = data[index]?.logo || `/logos/${marketplace}.png`
                return (
                  <image
                    href={logoSrc}
                    x={x - 12}
                    y={y - 12}
                    width={35}
                    height={35}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )
              }}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value} orders`} />
            
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}