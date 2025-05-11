'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Package, DollarSign, Boxes, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import OrderDetailsSc from '@/components/modals/OrderDetailsSc'
import { SyncOrdersButton } from '@/components/buttons/SyncOrdersButton'

export default function DashboardSellercloud() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<'order_id' | 'marketplace' | 'status' | 'total_amount'>('order_id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [marketplaceFilter, setMarketplaceFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccountIdAndOrders() {
      if (!session?.user?.id) return

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('created_by_user_id', session.user.id)
        .maybeSingle()

      if (accountError || !accountData) {
        console.error('Erro ao buscar account:', accountError)
        return
      }

      setAccountId(accountData.id)

      const { data: orderData, error: orderError } = await supabase
        .from('get_sellercloud_orders')
        .select('*')

      if (orderError) {
        console.error('Erro ao buscar pedidos:', orderError)
        return
      }

      let filtered = orderData.filter((o: any) =>
        o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.marketplace?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      if (statusFilter) {
        filtered = filtered.filter((o: any) => o.status === statusFilter)
      }
      if (startDate) {
        filtered = filtered.filter((o: any) => o.order_date && o.order_date >= startDate)
      }
      if (endDate) {
        filtered = filtered.filter((o: any) => o.order_date && o.order_date <= endDate)
      }
      if (marketplaceFilter) {
        filtered = filtered.filter((o: any) => o.marketplace === marketplaceFilter)
      }

      let sorted = filtered.sort((a: any, b: any) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })

      setOrders(sorted)
    }

    fetchAccountIdAndOrders()
  }, [
    session,
    searchTerm,
    sortColumn,
    sortDirection,
    statusFilter,
    startDate,
    endDate,
    marketplaceFilter
  ])

  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(orders.length / itemsPerPage)

  const cards = [
    { title: 'Orders', icon: <Package size={20} />, value: orders.length, color: 'text-[#3f2d90]' },
    { title: 'Sales', icon: <DollarSign size={20} />, value: '$ 0.00', color: 'text-[#3f2d90]' },
    { title: 'Inventory', icon: <Boxes size={20} />, value: 0, color: 'text-[#3f2d90]' },
    { title: 'In Transit', icon: <Truck size={20} />, value: 0, color: 'text-[#3f2d90]' }
  ]

  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  function renderSortIcon(column: typeof sortColumn) {
    if (sortColumn !== column) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  function exportCSV() {
    const headers = ['Order ID', 'Marketplace', 'Status', 'Total']
    const rows = orders.map((o) => [o.order_id, o.marketplace, o.status, o.total_amount])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'sellercloud_orders.csv')
    link.click()
  }

  const statusMap: Record<number, string> = {
    [-1]: 'Cancelled',
    2: 'Processing',
    3: 'Completed'
  }

  const marketplaceIcons: Record<number | string, string> = {
    4: '/logos/amazon.png',
    27: '/logos/wayfair.png',
    28: '/logos/walmart.png',
    37: '/logos/ebay.png',
    41: '/logos/shopify.png',
    61: '/logos/magento.png',
    62: '/logos/manual.png',
    64: '/logos/custom.png',
    71: '/logos/overstock.png',
    73: '/logos/target.png',
    75: '/logos/houzz.png',
    default: '/logos/marketplace.png'
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 space-y-10">
      <h1 className="text-3xl font-bold text-primary mb-6">Orders</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-center"
          >
            <div className={`bg-gray-100 p-2 rounded-full ${card.color}`}>{card.icon}</div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{card.title}</p>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Filters</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search by ID or Marketplace"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <select
            value={marketplaceFilter}
            onChange={(e) => setMarketplaceFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Marketplaces</option>
            {Array.from(new Set(orders.map((o) => o.marketplace))).filter(Boolean).map((mp, i) => (
              <option key={i} value={mp}>{mp}</option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            className=" text-white text-sm px-3 py-1 rounded bg-[#3f2d90] hover:bg-[#3f2d90]/90"
          >
            Export CSV
          </button>
          {accountId && <SyncOrdersButton accountId={accountId} />}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Order ID</th>
              <th className="py-3 px-4 text-left font-medium">Order Date</th>
              <th className="py-3 px-4 text-left font-medium">Marketplace</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Total</th>
              <th className="py-3 px-4 text-left font-medium">Ship Date</th>
              <th className="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedOrders.map((order, index) => {
              const statusText = statusMap[order.status_code] || 'Unknown'
              const statusColor = {
                'Completed': 'bg-green-100 text-green-700',
                'Processing': 'bg-[#3f2d90]/20 text-[#3f2d90]',
                'Cancelled': 'bg-red-100 text-red-700',
                'New': 'bg-primary/20 text-primary',
                'Unknown': 'bg-gray-100 text-gray-500'
              }[statusText]
              const iconSrc = marketplaceIcons[order.marketplace] || marketplaceIcons.default

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {order.order_id}
                    <div className="text-xs text-gray-500">{order.client_name || '—'}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{order.order_date?.split('T')[0]}</td>
                  <td className="py-3 px-4 flex items-center gap-2 text-gray-600">
                    <img src={iconSrc} className="w-7 h-7" />
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">$ {order.total_amount?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-500">{order.ship_date?.split('T')[0]}</td>
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
              )
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-center p-4 text-sm">
          <span className="text-gray-600">
            Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length}
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

      <OrderDetailsSc
        order={selectedOrder}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  )
}