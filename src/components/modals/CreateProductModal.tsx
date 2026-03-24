'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Source = 'sellercloud' | 'extensiv'

interface Props {
  open: boolean
  onClose: () => void
  defaultSource?: Source
}

const initialForm = {
  sku: '',
  name: '',
  description: '',
  upc: '',
  price: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  companyId: '',
  warehouseId: '',
  customerId: '',
}

export function CreateProductModal({ open, onClose, defaultSource = 'sellercloud' }: Props) {
  const [source, setSource] = useState<Source>(defaultSource)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: number; name: string | null }>>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  const isExtensiv = useMemo(() => source === 'extensiv', [source])

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setForm(initialForm)
    setSource(defaultSource)
  }

  // Load extensiv customers for dropdown
  useEffect(() => {
    if (!open || source !== 'extensiv') return
    setLoadingCustomers(true)
    fetch('/api/products/create?source=extensiv')
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load customers')
        const list = Array.isArray(json?.customers) ? json.customers : []
        setCustomers(list)
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, customerId: String(list[0].id ?? '') }))
        }
      })
      .catch((err) => {
        console.warn('customer load', err)
        toast.error(err?.message || 'Could not load customers')
      })
      .finally(() => setLoadingCustomers(false))
  }, [open, source])

  const handleSubmit = async () => {
    if (!form.sku.trim()) {
      toast.error('SKU is required')
      return
    }

    if (isExtensiv && !form.customerId.trim()) {
      toast.error('Customer ID is required for Extensiv')
      return
    }

    setLoading(true)
    try {
      const payload = {
        source,
        product: {
          sku: form.sku.trim(),
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          upc: form.upc.trim() || undefined,
          price: form.price ? Number(form.price) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          length: form.length ? Number(form.length) : undefined,
          width: form.width ? Number(form.width) : undefined,
          height: form.height ? Number(form.height) : undefined,
          companyId: form.companyId ? Number(form.companyId) : undefined,
          warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
          customerId: form.customerId ? Number(form.customerId) : undefined,
        },
      }

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to create product')
      }

      const suffix = json.alreadyExisted ? ' (already existed)' : ''
      toast.success(`Product saved to ${source}${suffix}`)
      reset()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Unable to create product')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create product</h2>
            <p className="text-sm text-gray-500">Send a new SKU to {source === 'sellercloud' ? 'Sellercloud' : 'Extensiv'}</p>
          </div>
          <div className="flex gap-2">
            <button
              className={`rounded border px-3 py-1 text-sm ${source === 'sellercloud' ? 'border-primary text-primary' : 'border-gray-300 text-gray-600'}`}
              onClick={() => setSource('sellercloud')}
              disabled={loading}
            >
              Sellercloud
            </button>
            <button
              className={`rounded border px-3 py-1 text-sm ${source === 'extensiv' ? 'border-primary text-primary' : 'border-gray-300 text-gray-600'}`}
              onClick={() => setSource('extensiv')}
              disabled={loading}
            >
              Extensiv
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">SKU *</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="SKU"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Product name"
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Short description"
              rows={2}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">UPC</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.upc}
              onChange={(e) => handleChange('upc', e.target.value)}
              placeholder="UPC"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Weight (lb)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              placeholder="e.g. 1.2"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">L</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.length}
                onChange={(e) => handleChange('length', e.target.value)}
                placeholder="in"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">W</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.width}
                onChange={(e) => handleChange('width', e.target.value)}
                placeholder="in"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">H</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="in"
                disabled={loading}
              />
            </div>
          </div>

          {!isExtensiv && (
            <div>
              <label className="text-sm font-medium text-gray-700">Company ID (Sellercloud)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                placeholder="Optional if default set in integration"
                disabled={loading}
              />
            </div>
          )}

          {!isExtensiv && (
            <div>
              <label className="text-sm font-medium text-gray-700">Warehouse ID (optional)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.warehouseId}
                onChange={(e) => handleChange('warehouseId', e.target.value)}
                placeholder="Default warehouse"
              />
            </div>
          )}

          {isExtensiv && (
            <div>
              <label className="text-sm font-medium text-gray-700">Customer *</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.customerId}
                onChange={(e) => handleChange('customerId', e.target.value)}
                disabled={loadingCustomers || loading}
              >
                {loadingCustomers && <option>Loading...</option>}
                {!loadingCustomers && customers.length === 0 && (
                  <option value="">No customers found</option>
                )}
                {!loadingCustomers &&
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || `Customer ${c.id}`}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 text-sm">
          <Button variant="ghost" onClick={() => { reset(); onClose() }} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateProductModal
