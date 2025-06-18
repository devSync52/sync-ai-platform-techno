'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Package, DollarSign, Boxes, Truck, ShoppingBag, DollarSignIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import OrderDetailsSc from '@/components/modals/OrderDetailsSc'
import { SyncOrdersButton } from '@/components/buttons/SyncOrdersButton'
import FilterBar from '@/components/FilterBar'
import { Button } from '@/components/ui/button'
import OrderCharts from '@/components/dashboard/OrderCharts'

export default function DashboardOrdersUnified() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [marketplaceFilter, setMarketplaceFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all') // <- NOVO!
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccountIdAndOrders() {
      if (!session?.user?.id) return

      const { data: accountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('created_by_user_id', session.user.id)
        .maybeSingle()

      if (!accountData) return

      setAccountId(accountData.id)

      const { data: orderData, error } = await supabase
        .from('ai_orders_unified_3')
        .select('*')
        .eq('account_id', accountData.id)

      if (error) return console.error('Erro ao buscar pedidos:', error)

      setOrders(orderData || [])
    }

    fetchAccountIdAndOrders()
  }, [session])

  // --- Mapeamentos ---
  const marketplaceMap: Record<string | number, string> = {
    1: 'Ebay', 4: 'Amazon', 6: 'Website', 20: 'Fba', 27: 'Wayfair', 50: 'Walmart',
    41: 'Magento', 51: 'Custom', default: 'Unknown'
  }
  const statusMap: Record<string, string> = {
    Cancelled: 'Cancelled', Processing: 'Processing', Shipped: 'Shipped', Allocated: 'Allocated', Closed: 'Closed', Open: 'Open', Other: 'Other'
  }
  const marketplaceIcons: Record<number | string, string> = {
    4: '/logos/amazon.png', 27: '/logos/wayfair.png', 50: '/logos/walmart.png',
    1: '/logos/ebay.png', 41: '/logos/shopify.png', 20: '/logos/fba.png',
    62: '/logos/manual.png', 64: '/logos/custom.png', 71: '/logos/overstock.png',
    73: '/logos/target.png', 75: '/logos/houzz.png', default: '/logos/marketplace.png'
  }

  // --- Filtro Dinâmico ---
  const filteredOrders = orders.filter((o) => {
    // Fonte (Sellercloud, Extensiv, All)
    const matchesSource = sourceFilter === 'all' || o.source === sourceFilter

    // Pesquisa
    const matchesSearch =
      (o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.marketplace_code?.toLowerCase?.().includes(searchTerm.toLowerCase()) ||
        o.client_name?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Status
    const matchesStatus = statusFilter ? o.order_status === statusFilter : true

    // Marketplace só faz sentido para Sellercloud
    const matchesMarketplace =
      !marketplaceFilter || o.marketplace_name === marketplaceFilter

    // Datas
    const orderDate = o.order_date ? new Date(o.order_date) : null
    const from = startDate ? new Date(startDate) : null
    const to = endDate ? new Date(endDate) : null
    const matchesDate =
      (!from || (orderDate && orderDate >= from)) &&
      (!to || (orderDate && orderDate <= to))

    return matchesSource && matchesSearch && matchesStatus && matchesMarketplace && matchesDate
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.order_date || '').getTime()
    const dateB = new Date(b.order_date || '').getTime()
    return dateB - dateA
  })

  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage) * itemsPerPage
  )
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  // --- Cards ---
  const cards = [
    { title: 'Orders', icon: <ShoppingBag size={25} />, value: filteredOrders.length, color: 'text-[#3f2d90]' },
    {
      title: 'Sales',
      icon: <DollarSignIcon size={25} />,
      value: filteredOrders.reduce((sum, o) => sum + (o.grand_total || 0), 0)
        .toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }),
      color: 'text-primary'
    }
  ]

  // --- Export CSV ---
  const exportToCSV = (data: any[], filename = 'orders.csv') => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}` : val
        ).join(',')
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Marketplaces válidos só quando for Sellercloud ---
  const sellercloudMarketplaces = Array.from(new Set(
    orders.filter(o => o.source === 'sellercloud')
      .map(o => o.marketplace_name)
      .filter(Boolean)
  ))

  // --- Status possíveis (pode expandir) ---
  const statusOptions = Array.from(new Set(orders.map(o => o.order_status))).filter(Boolean)

  return (
    <div className="p-6">
      <div className="bg-gray-50 min-h-screen p-4 sm:p-0 space-y-6">
        {/* Cards e gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2">
            <OrderCharts />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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
        </div>
  
        {/* Header + botão sync */}
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
            setMarketplaceFilter(null)
            setStartDate('')
            setEndDate('')
            setSourceFilter('all')
          }}
          filters={[
            {
              label: 'Source',
              value: sourceFilter,
              options: ['All source', 'sellercloud', 'extensiv'],
              onChange: setSourceFilter
            },
            {
              label: 'Start Date',
              value: startDate,
              type: 'date',
              options: [],
              onChange: setStartDate
            },
            {
              label: 'End Date',
              value: endDate,
              type: 'date',
              options: [],
              onChange: setEndDate
            },
            {
              label: 'Status',
              value: statusFilter ?? '',
              options: ['All status', ...statusOptions],
              onChange: (v) => setStatusFilter(v !== 'All' ? v : null)
            },
          ]}
        />
  
        {/* Paginação */}
        <div className="flex items-center justify-end gap-4 mb-0 text-sm">
          <span>Show:</span>
          {[10, 25, 50].map((count) => (
            <button
              key={count}
              className={`px-1 py-1 rounded ${itemsPerPage === count ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600'}`}
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
                <th className="py-3 px-4 text-left font-medium">Marketplace</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
                <th className="py-3 px-4 text-left font-medium">Total</th>
                <th className="py-3 px-4 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order, index) => {
                type OrderStatus = 'Shipped' | 'Processing' | 'Cancelled' | 'Allocated' | 'Closed' | 'Open' | 'Other' | 'Unknown'

                const statusColorMap: Record<OrderStatus, string> = {
                  Shipped: 'bg-green-100 text-green-700',
                  Processing: 'bg-[#3f2d90]/20 text-[#3f2d90]',
                  Cancelled: 'bg-red-100 text-red-700',
                  Allocated: 'bg-blue-100 text-blue-700',
                  Closed: 'bg-gray-100 text-gray-500',
                  Open: 'bg-yellow-100 text-yellow-700',
                  Other: 'bg-gray-100 text-gray-500',
                  Unknown: 'bg-gray-100 text-gray-500',
                }
                
                const statusText = (order.order_status as OrderStatus) || 'Unknown'
                const statusColor = statusColorMap[statusText] || 'bg-gray-100 text-gray-500'
  
                const iconSrc = order.source === 'sellercloud'
                  ? (marketplaceIcons[order.marketplace_code] || marketplaceIcons.default)
                  : '/logos/warehouse.png'
  
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {order.order_id}
                      <div className="text-xs text-gray-500">{order.client_name || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${order.source === 'sellercloud' ? 'bg-blue-600 text-white' : 'bg-purple-500 text-white'}`}>
                        {order.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{order.order_date?.split('T')[0]}</td>
                    <td className="py-3 px-4 flex items-center gap-2 text-gray-600">
                      {order.source === 'sellercloud' ? (
                        <img src={iconSrc} className="h-8" alt="marketplace" />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-500">
                          Warehouse
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                        {statusText}
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
                )
              })}
            </tbody>
          </table>
  
          {/* Paginação */}
          <div className="flex justify-between items-center p-4 text-sm">
            <span className="text-gray-600">
              Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
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