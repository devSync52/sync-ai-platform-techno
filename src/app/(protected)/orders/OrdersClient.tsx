'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import OrderDetailsSc from '@/components/modals/OrderDetailsSc'
import { SyncOrdersButton } from '@/components/buttons/SyncOrdersButton'
import FilterBar from '@/components/FilterBar'
import { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { startOfMonth, endOfMonth } from 'date-fns'
import '@/styles/daypicker-custom.css'

export default function OrdersClient({ userId }: { userId: string }) {
  const supabase = useSupabase()
  const [orders, setOrders] = useState<any[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [allStatusOptions, setAllStatusOptions] = useState<string[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const startDate = selectedRange?.from?.toISOString().slice(0, 10) || ''
  const endDate = selectedRange?.to?.toISOString().slice(0, 10) || ''
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getMarketplaceLogo = (name: string | null | undefined) => {
    if (!name) return null
  
    const normalized = name.toLowerCase()
  
    const logos: Record<string, string> = {
      fba: '/logos/fba.png',
      amazon: '/logos/amazon.png',
      walmart: '/logos/walmart.png',
      ebay: '/logos/ebay.png',
      wayfair: '/logos/wayfair.png',
      website: '/logos/marketplace.png',
    }
  
    return logos[normalized] || null
  }

  useEffect(() => {
    async function fetchData() {
      const start = (currentPage - 1) * itemsPerPage
      const end = start + itemsPerPage - 1
  
      const { data: userRecord } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', userId)
        .maybeSingle()
  
      if (!userRecord) return
  
      const userAccountId = userRecord.account_id
      const userRole = userRecord.role
      if (!userAccountId) return
  
      setAccountId(userAccountId)

      const { data: statusRows, error: statusError } = await supabase
        .from('ai_orders_unified_6')
        .select('order_status')
        .eq(
          userRole === 'client' || userRole === 'staff-client'
            ? 'channel_account_id'
            : 'account_id',
          userAccountId
        )

      if (statusError) {
        console.error('❌ Error fetching status options:', statusError.message)
      } else {
        const allStatuses = Array.from(new Set(statusRows?.map(r => r.order_status).filter(Boolean)))
        setAllStatusOptions(allStatuses)
      }
  
      let query = supabase
        .from('ai_orders_unified_6')
        .select(
          'order_uuid, order_id, order_source_order_id, client_name, grand_total, order_date, status_code, shipping_status, payment_status, order_status, source, marketplace_name, channel_account_id',
          { count: 'exact' }
        )

// ✅ Filtrar corretamente dependendo da role
if (userRole === 'client' || userRole === 'staff-client') {
  query = query.eq('channel_account_id', userAccountId)
} else {
  query = query.eq('account_id', userAccountId)
}

if (sourceFilter !== 'all') {
  query = query.eq('source', sourceFilter)
}

if (statusFilter) {
  query = query.eq('order_status', statusFilter)
}

if (startDate) {
  query = query.gte('order_date', startDate)
}

if (endDate) {
  query = query.lte('order_date', endDate)
}

if (searchTerm) {
  query = query.or(
    `order_id.ilike.%${searchTerm}%,marketplace_name.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,order_source_order_id.ilike.%${searchTerm}%`
  )
}

// ✅ Ordenação por data decrescente
query = query.order('order_date', { ascending: false })

const { data, count, error } = await query.range(start, end)
  
      if (error) {
        console.error('❌ Error fetching orders:', error.message)
        return
      }
  
      setOrders(data || [])
      setTotalCount(count || 0)
      setUserRole(userRecord.role)
    }
  
    fetchData()
  }, [
    userId,
    currentPage,
    itemsPerPage,
    supabase,
    sourceFilter,
    statusFilter,
    startDate,
    endDate,
    searchTerm,
  ])

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

  return (
    <div className="p-6">
        <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-primary">Orders</h1>
  <div className="flex gap-4 items-center">
    <DateRangePicker
      date={selectedRange}
      setDate={setSelectedRange}
    />
    </div>
  </div>

      <FilterBar
        title="Unified Orders"
        placeholder={
          userRole === 'client' || userRole === 'staff-client'
            ? 'Search by Order ID or Marketplace'
            : 'Search by Order ID, Client, or Marketplace'
        }
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        totalCount={totalCount}
        filteredCount={orders.length}
        onReset={() => {
          setSearchTerm('')
          setStatusFilter(null)
          setSourceFilter('all')
        }}
        filters={[
          ...(userRole !== 'client'
            ? [
                {
                  label: 'Source',
                  value: sourceFilter,
                  options: ['All sources', 'sellercloud', 'extensiv'],
                  onChange: (v: string) => setSourceFilter(v === 'All sources' ? 'all' : v),
                },
              ]
            : []),
          {
            label: 'Status',
            value: statusFilter ?? 'all',
            options: ['All status', ...allStatusOptions],
            onChange: (v: string) => setStatusFilter(v !== 'All status' ? v : null),
          },
        ]}
      />

      <div className="flex items-center justify-end gap-4 mb-0 mt-2 text-sm">
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
        <Button onClick={() => exportToCSV(orders)} className="text-sm">
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm mt-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Order ID</th>
              <th className="py-3 px-4 text-left font-medium">Marketplace</th>
              <th className="py-3 px-4 text-left font-medium">Order Marketplace ID</th>
              {userRole !== 'client' && (
  <th className="py-3 px-4 text-left font-medium">Source</th>
)}
              <th className="py-3 px-4 text-left font-medium">Order Date</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Total</th>
              <th className="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">
                  {order.order_id}
                  <div className="text-xs text-gray-500">
                    {order.client_name || '—'}
                  </div>
                </td>
                <td className="py-3 px-4">
  <div className="flex items-center gap-2">
    {getMarketplaceLogo(order.marketplace_name) && (
      <img
        src={getMarketplaceLogo(order.marketplace_name)!}
        alt={order.marketplace_name}
        className="w-8 h-8 object-contain rounded"
      />
    )}
    
  </div>
</td>
<td className="py-3 px-4 text-gray-700">
  {order.order_source_order_id || '—'}
</td>{userRole !== 'client' && (
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
                </td>)}
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
                      setSelectedOrder({ ...order, id: order.order_uuid })
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

        <div className="flex justify-between items-center p-4 text-sm">
          <span className="text-gray-600">
            Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
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
        onCloseAction={() => setModalOpen(false)}
      />
    </div>
  )
}