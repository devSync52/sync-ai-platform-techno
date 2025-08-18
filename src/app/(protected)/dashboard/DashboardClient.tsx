'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { ShoppingBag, DollarSignIcon, PackageCheck, Settings2 } from 'lucide-react'
import { DashboardCard } from '@/types/dashboard'
import ShippedOrdersChart from '@/components/dashboard/ShippedOrdersChart'
import NewOrdersChart from '@/components/dashboard/NewOrderChart'
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { DateRange } from 'react-day-picker'
import { startOfMonth, endOfMonth } from 'date-fns'
import '@/styles/daypicker-custom.css'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import DashboardBuilder from '@/components/dashboard/DashboardBuilder'
import SalesVsPreviousMonthChart from '@/components/dashboard/SalesVsPreviousMonthChart'
import SalesByMarketplaceChart from '@/components/dashboard/SalesByMarketplaceChart'
import OrdersPerDayChart from '@/components/dashboard/OrdersPerDayChart'
import LowStockAlertChart from '@/components/dashboard/LowStockAlertChart'
import ReorderForecastChart from '@/components/dashboard/ReorderForecastChart'
import TopSellingProductsChart from '@/components/dashboard/TopSellingProductsChart'
import { Button } from '@/components/ui/button'



export default function DashboardClient({ userId }: { userId: string }) {
  const supabase = useSupabase()

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  


  const [orders, setOrders] = useState<any[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [startDate, setStartDate] = useState(() =>
    startOfMonth(new Date()).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(() =>
    endOfMonth(new Date()).toISOString().split('T')[0]
  )

  const {
    cardsOrder = [],
    visibleCards = [],
    saveOrder,
    toggleCard,
    resetLayout,
    reloadPreferences,
    loading,
  } = useDashboardPreferences(userId)

  const [openBuilder, setOpenBuilder] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', userId)
        .maybeSingle()
  
      if (userError || !userRecord) {
        console.error('❌ Error fetching user info:', userError?.message)
        return
      }
  
      const userRole = userRecord.role
      setUserRole(userRole)
      const userAccountId = userRecord.account_id
  
      if (!userAccountId) {
        setAccountId(null)
        setOrders([])
        return
      }
  
      setAccountId(userAccountId)
  
      let query = supabase
        .from('sellercloud_orders')
        .select('*')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
  
      if (userRole === 'client' || userRole === 'staff-client') {
        query = query.eq('channel_account_id', userAccountId)
      } else {
        query = query.eq('account_id', userAccountId)
      }
  
      const { data: ordersData, error: ordersError } = await query
  
      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError.message)
        return
      }
  
      setOrders(ordersData || [])
    }
  
    fetchData()
  }, [userId, supabase, startDate, endDate])

  

  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const ordersInTransit = orders.filter(o => o.order_status?.toLowerCase() === 'shipped').length
  const returns = orders.filter(o => o.order_status?.toLowerCase() === 'cancelled').length
  const pendingOrders = orders.filter(o =>
    ['pending', 'processing'].includes(o.order_status?.toLowerCase())
  ).length

  const dashboardCards: DashboardCard[] = [
    {
      id: 'total_orders',
      label: (
        <div className="flex items-center gap-3">
          <ShoppingBag />
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-xl font-bold text-[#3f2d90]">{totalOrders}</p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'total_sales',
      label: (
        <div className="flex items-center gap-3">
          <DollarSignIcon />
          <div>
            <p className="text-xs text-gray-500">Sales</p>
            <p className="text-xl font-bold text-primary">
              {totalRevenue.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'average_ticket',
      label: (
        <div className="flex items-center gap-3">
          <DollarSignIcon />
          <div>
            <p className="text-xs text-gray-500">Average Ticket</p>
            <p className="text-xl font-bold text-primary">
              {averageTicket.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'orders_shipped',
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Orders closed</p>
            <p className="text-xl font-bold text-[#3f2d90]">{ordersInTransit}</p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'returns',
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Returns</p>
            <p className="text-xl font-bold text-red-500">{returns}</p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'pending_orders',
      label: (
        <div className="flex items-center gap-3">
          <PackageCheck />
          <div>
            <p className="text-xs text-gray-500">Pending Orders</p>
            <p className="text-xl font-bold text-yellow-500">{pendingOrders}</p>
          </div>
        </div>
      ),
      type: 'kpi',
    },
    {
      id: 'new_orders_chart',
      label: userRole && accountId ? (
        <div key={`new-orders-${Math.random()}`}>
          <NewOrdersChart userRole={userRole} userAccountId={accountId} />
        </div>
      ) : null,
      type: 'chart',
    },
    {
      id: 'shipped_orders_chart',
      label: userRole && accountId ? (
        <div key={`shipped-orders-${Math.random()}`}>
          <ShippedOrdersChart userRole={userRole} userAccountId={accountId} />
        </div>
      ) : null,
      type: 'chart',
    },
    {
      id: 'sales_vs_previous_month_chart',
      label: userRole && accountId ? (
        <div key={`sales-vs-previous-${Math.random()}`}>
          <SalesVsPreviousMonthChart userRole={userRole} userAccountId={accountId} />
        </div>
      ) : null,
      type: 'chart',
    },
    {
      id: 'sales_by_marketplace_chart',
      label: userRole && accountId ? (
        <div key={`sales-by-marketplace-${Math.random()}`}>
          <SalesByMarketplaceChart userRole={userRole} userAccountId={accountId} />
        </div>
      ) : null,
      type: 'chart',
    },
    {
      id: 'orders_per_day_chart',
      label: userRole && accountId ? (
        <div key={`orders-per-day-${Math.random()}`}>
          <OrdersPerDayChart userRole={userRole} userAccountId={accountId} />
        </div>
      ) : null,
      type: 'chart',
    },
    {
      id: 'top_selling_products_chart',
      label: accountId ? <TopSellingProductsChart accountId={accountId} /> : null,
      type: 'chart',
    }
  ]

  const displayedCards = (cardsOrder.length > 0 ? cardsOrder : dashboardCards.map(card => card.id))
    .filter(id => visibleCards.includes(id))



  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  
      <div className="space-y-2 mb-4">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="max-w-full">
          <DateRangePicker
            date={selectedRange}
            setDate={(range) => {
              setSelectedRange(range)
              setStartDate(range?.from?.toISOString().slice(0, 10) || '')
              setEndDate(range?.to?.toISOString().slice(0, 10) || '')
            }}
          />
        </div>
      </div>


<Sheet open={openBuilder} onOpenChange={(open) => {
    setOpenBuilder(open)
    if (!open) reloadPreferences()
  }}>
    <SheetTrigger asChild>
      <Button variant="outline" className="text-sm">
        <Settings2 className="w-4 h-4 mr-2" />
        Customize
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-[90vw] sm:w-[600px] overflow-y-auto p-6">
      <DashboardBuilder userId={userId} />
    </SheetContent>
  </Sheet>
      </div>

      <DashboardGrid
  cards={dashboardCards.filter((card) => visibleCards.includes(card.id))}
  order={displayedCards}
  onDragEnd={(newOrder) => saveOrder(newOrder)}
/>
    </div>
  )
}