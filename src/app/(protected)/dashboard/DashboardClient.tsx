'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { ShoppingBag, DollarSignIcon, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OrderDetailsSc from '@/components/modals/OrderDetailsSc'
import { SyncOrdersButton } from '@/components/buttons/SyncOrdersButton'
import FilterBar from '@/components/FilterBar'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import NewOrdersChart from '@/components/dashboard/NewOrderChart'
import ShippedOrdersChart from '@/components/dashboard/ShippedOrdersChart'
import { DashboardCard } from '@/types/dashboard'
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences'

export default function DashboardClient({ userId }: { userId: string }) {
  const supabase = useSupabase()

  const [orders, setOrders] = useState<any[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { cardsOrder, saveOrder, loading: loadingCards } = useDashboardPreferences(userId)

  useEffect(() => {
  async function fetchData() {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('created_by_user_id', userId)
      .maybeSingle()

    if (accountError) {
      console.error('❌ Error fetching account:', accountError.message)
      return
    }

    if (!account) {
      console.warn('⚠️ No account found for this user:', userId)
      setAccountId(null)
      setOrders([])
      return
    }

    setAccountId(account.id)

    const { data: ordersData, error: ordersError } = await supabase
      .from('ai_orders_unified_3')
      .select('*')
      .eq('account_id', account.id)

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message)
      return
    }

    setOrders(ordersData || [])
  }

  fetchData()
}, [userId, supabase])

  const filteredOrders = orders.filter((o) => {
    const matchesSource = sourceFilter === 'all' || o.source === sourceFilter
    const matchesSearch =
      (o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.marketplace_code?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        o.client_name?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter ? o.order_status === statusFilter : true

    const orderDate = o.order_date ? new Date(o.order_date) : null
    const from = startDate ? new Date(startDate) : null
    const to = endDate ? new Date(endDate) : null
    const matchesDate =
      (!from || (orderDate && orderDate >= from)) &&
      (!to || (orderDate && orderDate <= to))

    return matchesSource && matchesSearch && matchesStatus && matchesDate
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.order_date || '').getTime()
    const dateB = new Date(b.order_date || '').getTime()
    return dateB - dateA
  })

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  // 🔥 KPIs Cálculos
  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const ordersInTransit = filteredOrders.filter(
    (o) => o.order_status?.toLowerCase() === 'shipped'
  ).length
  const returns = filteredOrders.filter(
    (o) => o.order_status?.toLowerCase() === 'cancelled'
  ).length

  const pendingOrders = filteredOrders.filter(
    (o) =>
      ['pending', 'processing'].includes(
        o.order_status?.toLowerCase()
      )
  ).length

  const dashboardCards: DashboardCard[]= [
    {
      id: 'orders',
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
      id: 'sales',
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
      id: 'orders_in_transit',
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
      label: <NewOrdersChart />,
      type: 'chart',
    },
    {
      id: 'shipped_orders_chart',
      label: <ShippedOrdersChart />,
      type: 'chart',
    },
  ]
  const exportToCSV = (data: any[], filename = 'orders.csv') => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) =>
        Object.values(row)
          .map((val) =>
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}` : val
          )
          .join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const statusOptions = Array.from(new Set(orders.map((o) => o.order_status))).filter(Boolean)

  if (loadingCards) return <p>Loading dashboard...</p>

  return (
  
        
    <div className="p-6"><h1 className="text-2xl font-bold text-primary mb-2">Dashboard</h1>
      <div className="bg-gray-50 min-h-screen p-4 sm:p-0 space-y-6">
        {/* Cards + Gráfico com Drag & Drop */}
        <DashboardGrid
          cards={dashboardCards}
          order={cardsOrder.length ? cardsOrder : dashboardCards.map((c) => c.id)}
          onDragEnd={saveOrder}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          {accountId && <SyncOrdersButton accountId={accountId} />}
        </div>

        {/* Filtros */}
        <FilterBar
          title="Unified Orders"
          placeholder="Search by Order ID, Client, or Marketplace"
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          totalCount={orders.length}
          filteredCount={filteredOrders.length}
          onReset={() => {
            setSearchTerm('')
            setStatusFilter(null)
            setStartDate('')
            setEndDate('')
            setSourceFilter('all')
          }}
          filters={[
            {
              label: 'Source',
              value: sourceFilter,
              options: ['All source', 'sellercloud', 'extensiv'],
              onChange: setSourceFilter,
            },
            {
              label: 'Start Date',
              value: startDate,
              type: 'date',
              options: [],
              onChange: setStartDate,
            },
            {
              label: 'End Date',
              value: endDate,
              type: 'date',
              options: [],
              onChange: setEndDate,
            },
            {
              label: 'Status',
              value: statusFilter ?? '',
              options: ['All status', ...statusOptions],
              onChange: (v) => setStatusFilter(v !== 'All' ? v : null),
            },
          ]}
        />

        {/* Pagination */}
        <div className="flex items-center justify-end gap-4 mb-0 text-sm">
          <span>Show:</span>
          {[10, 25, 50].map((count) => (
            <button
              key={count}
              className={`px-1 py-1 rounded ${
                itemsPerPage === count
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-600'
              }`}
              onClick={() => {
                setItemsPerPage(count)
                setCurrentPage(1)
              }}
            >
              {count}
            </button>
          ))}
          <Button onClick={() => exportToCSV(filteredOrders)} className="text-sm">
            Export CSV
          </Button>
        </div>

       {/* Tabela */}
       <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Order ID</th>
                <th className="py-3 px-4 text-left font-medium">Source</th>
                <th className="py-3 px-4 text-left font-medium">Order Date</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
                <th className="py-3 px-4 text-left font-medium">Total</th>
                <th className="py-3 px-4 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {order.order_id}
                    <div className="text-xs text-gray-500">
                      {order.client_name || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.source === 'sellercloud'
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {order.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {order.order_date?.split('T')[0]}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.order_status === 'Shipped'
                          ? 'bg-green-100 text-green-700'
                          : order.order_status === 'Processing'
                          ? 'bg-[#3f2d90]/20 text-[#3f2d90]'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    {order.grand_total !== null
                      ? `$${Number(order.grand_total).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setModalOpen(true)
                      }}
                      className="text-white px-1 py-1 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition min-w-[80px]"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 text-sm">
            <span className="text-gray-600">
              Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
              {filteredOrders.length}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        <OrderDetailsSc
          order={selectedOrder}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </div>
  )
}