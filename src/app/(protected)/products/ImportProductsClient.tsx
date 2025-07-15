'use client'

import { useEffect, useState } from 'react'
import { ProductList } from '@/types/supabase'
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

  const deduplicated = Object.values(
    products.reduce((acc, product) => {
      if (
        !acc[product.sku] ||
        new Date(product.updated_at ?? 0) > new Date(acc[product.sku].updated_at ?? 0)
      ) {
        acc[product.sku] = product
      }
      return acc
    }, {} as Record<string, ProductList>)
  )

  const filtered = deduplicated.filter((p) => {
    return (
      (!companyFilter || p.company === companyFilter) &&
      (!statusFilter || (statusFilter === 'Active' ? p.is_active : !p.is_active)) &&
      (!typeFilter || p.product_type === typeFilter) &&
      (p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'sku') return a.sku.localeCompare(b.sku)
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
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
        placeholder="Search by SKU or Product Name"
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
            label: 'Type',
            value: typeFilter ?? '',
            options: ['All types', ...Array.from(new Set(products.map(p => p.product_type).filter((v): v is string => !!v)))],
            onChange: (v) => setTypeFilter(v !== 'All' ? v : null)
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
              <th className="py-3 px-4 text-left font-medium">Photo</th>
              <th className="py-3 px-4 text-left font-medium">Product Name</th>
              <th className="py-3 px-4 text-left font-medium">Dimensions</th>
              <th className="py-3 px-4 text-left font-medium">Qty Avail.</th>
              <th className="py-3 px-4 text-left font-medium">Physical Qty</th>
              <th className="py-3 px-4 text-left font-medium">Warehouse</th>
              <th className="py-3 px-4 text-left font-medium">Company</th>
              <th className="py-3 px-4 text-left font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-800 font-medium">{product.sku || '-'}</td>
                <td className="py-3 px-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name || 'Product image'}
                      width={40}
                      height={40}
                      className="rounded object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">{product.name || '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.dimensions || '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.quantity_available ?? '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.quantity_physical ?? '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.warehouse_name || '-'}</td>
                <td className="py-3 px-4 text-gray-600">{product.company || '-'}</td>
                <td className="py-3 px-4 text-gray-600">
                  {product.site_price !== null && product.site_price !== undefined
                    ? `$${product.site_price.toFixed(2)}`
                    : '-'}
                </td>
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