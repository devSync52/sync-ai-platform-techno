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

export default function DashboardSellercloud() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [marketplaceFilter, setMarketplaceFilter] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  const [newOrders, setNewOrders] = useState<{ hour: string; value: number }[]>([])
  const [totalNewOrdersAmount, setTotalNewOrdersAmount] = useState(0)

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
        .from('view_all_orders')
        .select('*')

      if (error) return console.error('Erro ao buscar pedidos:', error)

      setOrders(orderData)
    }

    fetchAccountIdAndOrders()
  }, [session])

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.marketplace?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? o.status === statusFilter : true
    const matchesMarketplace = marketplaceFilter ? o.marketplace === marketplaceFilter : true

    const orderDate = o.order_date ? new Date(o.order_date) : null
    const from = startDate ? new Date(startDate) : null
    const to = endDate ? new Date(endDate) : null
    const matchesDate =
      (!from || (orderDate && orderDate >= from)) &&
      (!to || (orderDate && orderDate <= to))

    return matchesSearch && matchesStatus && matchesMarketplace && matchesDate
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

  const cards = [
    { title: 'Orders', icon: <ShoppingBag size={25} />, value: filteredOrders.length, color: 'text-[#3f2d90]' },
    { title: 'Sales', icon: <DollarSignIcon size={25} />, value: filteredOrders
    .reduce((sum, o) => sum + (o.total_amount || 0), 0)
    .toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }),
  color: 'text-primary' }
  ]

  const marketplaceMap: Record<string | number, string> = {
    1: 'Ebay',
    4: 'Amazon',
    6: 'Website',
    20: 'Fba',
    27: 'Wayfair',
    50: 'Walmart',
    41: 'Magento',
    51: 'Custom',
    default: 'Unknown'
  }

  const statusMap: Record<number, string> = {
    1: 'Cancelled',
    2: 'Processing',
    3: 'Shipped'
  }

  const marketplaceIcons: Record<number | string, string> = {
    4: '/logos/amazon.png',
    27: '/logos/wayfair.png',
    50: '/logos/walmart.png',
    1: '/logos/ebay.png',
    41: '/logos/shopify.png',
    20: '/logos/fba.png',
    62: '/logos/manual.png',
    64: '/logos/custom.png',
    71: '/logos/overstock.png',
    73: '/logos/target.png',
    75: '/logos/houzz.png',
    default: '/logos/marketplace.png'
  }

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

  return (
    <div className="p-6">
  <div className="bg-gray-50 min-h-screen p-4 sm:p-0 space-y-6">
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
  


        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          {accountId && <SyncOrdersButton accountId={accountId} />}
        </div>

        <FilterBar
          title="Sellercloud Orders"
          placeholder="Search by Order ID"
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
          }}
          filters={[
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
              options: ['All Statues', 'Shipped', 'Processing', 'Cancelled'],
              onChange: (v) => setStatusFilter(v !== 'All' ? v : null)
            },
            {
              label: 'Marketplace',
  value: marketplaceFilter ?? '',
  options: ['All Marketplaces', ...Array.from(new Set(orders.map(o => o.marketplace)))
    .filter(Boolean)
    .map(id => marketplaceMap[id] || `Marketplace ${id}`)],
  onChange: (v) => {
    const entry = Object.entries(marketplaceMap).find(([, name]) => name === v)
    setMarketplaceFilter(v !== 'All' ? entry?.[0] ?? null : null)
            }}
            
          ]}
        />

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
                <th className="py-3 px-4 text-left font-medium items-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order, index) => {
                const statusText = statusMap[order.status_code] || 'Unknown'
                const statusColor = {
                  Shipped: 'bg-green-100 text-green-700',
                  Processing: 'bg-[#3f2d90]/20 text-[#3f2d90]',
                  Cancelled: 'bg-red-100 text-red-700',
                  Unknown: 'bg-gray-100 text-gray-500'
                }[statusText]
                const iconSrc = marketplaceIcons[order.marketplace_code] || marketplaceIcons.default

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {order.order_id}
                      <div className="text-xs text-gray-500">{order.client_name || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{order.order_date?.split('T')[0]}</td>
                    <td className="py-3 px-4 flex items-center gap-2 text-gray-600">
                    <div className="flex items-center gap-2">
  <img src={iconSrc} className="h-8" />
  
</div>
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

        <OrderDetailsSc
          order={selectedOrder}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </div>
  )
}