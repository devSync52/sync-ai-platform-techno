'use client'

import { useEffect, useState } from 'react'
import { ProductList } from '@/types/supabase2'
import FilterBar from '@/components/FilterBar'
import { Button } from '@/components/ui/button'

interface Props {
  accountId: string | null
  companyName: string
  userRole: string
}

export default function ImportProductsClient({ accountId, companyName, userRole }: Props) {
  const [products, setProducts] = useState<ProductList[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<'sku' | 'name' | 'price'>('sku')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
  
      const queryParams = new URLSearchParams()
      queryParams.set('role', userRole)
  
      if (accountId) {
        queryParams.set('account_id', accountId)
      }
  
      const res = await fetch(`/api/products?${queryParams.toString()}`)
      const data = await res.json()
      setProducts(data.products || [])
      setLoading(false)
    }
  
    fetchProducts()
  }, [accountId, userRole])

  const deduplicated =
    userRole === 'client' || userRole === 'staff-client'
      ? Object.values(
          products.reduce((acc, product) => {
            const key = product.sku ?? product.id
            if (
              !acc[key] ||
              new Date(product.updated_at ?? 0) > new Date(acc[key].updated_at ?? 0)
            ) {
              acc[key] = product
            }
            return acc
          }, {} as Record<string, ProductList>)
        )
      : products

  const normalizedSearch = searchTerm.trim().toLowerCase()
  
  const filtered = deduplicated.filter((p) => {
    const matchesSearch =
      !normalizedSearch ||
      (p.sku ?? '').toLowerCase().includes(normalizedSearch) ||
      (p.description ?? '').toLowerCase().includes(normalizedSearch) ||
      (p.upc ?? '').toLowerCase().includes(normalizedSearch) ||
      (p.client_name ?? '').toLowerCase().includes(normalizedSearch) ||
      (p.account_name ?? '').toLowerCase().includes(normalizedSearch)
  
    return (
      (!companyFilter || p.account_name === companyFilter) &&
      (!statusFilter ||
        (statusFilter === 'Active'
          ? p.account_status === 'active'
          : p.account_status !== 'active')) &&
      (!typeFilter || p.product_source === typeFilter) &&
      matchesSearch
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'sku') return (a.sku ?? '').localeCompare(b.sku ?? '')
    if (sortBy === 'name') return (a.description || '').localeCompare(b.description || '')
    if (sortBy === 'price') return (b.site_price || 0) - (a.site_price || 0)
    return 0
  })

  const paginatedProducts = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const exportToCSV = (data: any[], filename = 'products.csv') => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
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
    <div className="bg-gray-50 min-h-screen p-0 sm:p-0 space-y-5">
      <FilterBar
        title="Products"
        placeholder="Search by SKU, UPC, Description, Client or Account"
        totalCount={products.length}
        filteredCount={filtered.length}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onReset={() => {
          setCompanyFilter(null)
          setStatusFilter(null)
          setTypeFilter(null)
          setSearchTerm('')
        }}
        filters={[
          //{
            //label: 'Company',
            //value: companyFilter ?? '',
            //options: ['All Companies', ...Array.from(new Set(products.map(p => p.company).filter((v): v is string => !!v)))],
            //onChange: (v) => setCompanyFilter(v !== 'All' ? v : null)
          //},
          {
            label: 'Source',
            value: typeFilter ?? '',
            options: ['All sources', ...Array.from(new Set(products.map(p => p.product_source).filter((v): v is string => !!v)))],
            onChange: (v) => setTypeFilter(v !== 'All sources' ? v : null)
          }
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

        <span>Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="sku">SKU</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>

        <Button
          onClick={() => exportToCSV(filtered)}
          className="text-sm"
        >
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium">SKU</th>
              <th className="py-3 px-4 text-left font-medium">Product Name</th>
              <th className="py-3 px-4 text-left font-medium">Dimensions</th>
              <th className="py-3 px-4 text-left font-medium">Qty Avail.</th>
              <th className="py-3 px-4 text-left font-medium">On-hold</th>
              <th className="py-3 px-4 text-left font-medium">Warehouse</th>
              {(userRole !== 'client' && userRole !== 'staff-client') && (
              <th className="py-3 px-4 text-left font-medium">Company</th>
            )}
              
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr
                key={`${product.id}-${product.account_id ?? product.client_account_id}`}
                className="hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800 font-medium">{product.sku || '-'}</td>
               
                <td className="py-3 px-4 text-gray-600">{product.description || '-'}</td>
                <td className="py-3 px-4 text-gray-600">
                  {product.pkg_length_in && product.pkg_width_in && product.pkg_height_in
                    ? `${product.pkg_length_in} x ${product.pkg_width_in} x ${product.pkg_height_in}`
                    : '-'}
                </td>
                <td className="py-3 px-4 text-gray-600">{product.available ?? '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.on_hold ?? '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.warehouse_name || '-'}</td>
                {(userRole !== 'client' && userRole !== 'staff-client') && (
                  <td className="py-3 px-4 text-gray-600">{product.account_name || '-'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center p-4 text-sm">
          <span className="text-gray-600">
            Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
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
    </div>
  )
}