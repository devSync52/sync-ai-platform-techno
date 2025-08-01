'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Database } from '@/types/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type PackageItem = {
  sku: string
  product_name?: string
  quantity: number
  length: number
  width: number
  height: number
  weight_lbs: number
  stackable?: boolean
  hazardous?: boolean
  freight_class?: string
  price?: number
  subtotal?: number
}

type Json = any

interface Step4PackageDetailsProps {
  draftId: string
  initialItems: Json
  onNext: () => void
  onBack: () => void
}

function ProductSearchModal({
  show,
  onClose,
  onAddProduct,
  clientId,
}: {
  show: boolean
  onClose: () => void
  onAddProduct: (product: PackageItem) => void
  clientId: string
}) {
  const supabase = useSupabase()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!clientId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('sellercloud_products')
      .select('sku, name, site_price, package_weight_lbs, length, width, height, external_id')
      .eq('channel_id', clientId)
      .or(`sku.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .limit(20)

    if (error) {
      console.error('❌ Failed to fetch products:', error)
      setResults([])
    } else {
      setResults(data || [])
    }
    setLoading(false)
  }

  const handleAdd = (product: any) => {
    const packageItem: PackageItem = {
      sku: product.sku,
      product_name: product.name || '',
      quantity: 1,
      length: product.length || 0,
      width: product.width || 0,
      height: product.height || 0,
      weight_lbs: product.package_weight_lbs || 0,
      stackable: false,
      hazardous: false,
      freight_class: '',
      price: product.site_price || 0,
      subtotal: product.price || 0,
    }
    onAddProduct(packageItem)
    onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-3xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Search Products</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none">
            ×
          </button>
        </div>
        <div className="mb-4 flex space-x-2">
          <Input
            type="text"
            placeholder="Search by SKU or Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div>
          {results.length === 0 && !loading && <p className="text-muted-foreground">No products found.</p>}
          <ul className="divide-y divide-gray-200 max-h-64 overflow-auto">
            {results.map((product, idx) => (
              <li key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{product.name || product.sku}</p>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <Button variant="secondary" onClick={() => handleAdd(product)}>
                  Add to package
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Step4PackageDetails({ draftId, initialItems, onNext, onBack }: Step4PackageDetailsProps) {
  const [items, setItems] = useState<PackageItem[]>([])
  const [showProductSearchModal, setShowProductSearchModal] = useState(false)
  const [clientId, setClientId] = useState<string>('')

  const supabase = useSupabase()
  const currentUser = useCurrentUser()

  useEffect(() => {
    async function fetchClientId() {
      if (!currentUser?.account_id) return

      const { data: draft, error: draftError } = await supabase
        .from('saip_quote_drafts')
        .select('client')
        .eq('id', draftId)
        .single()

      if (draftError || !draft?.client) {
        console.error('❌ Failed to fetch client ID:', draftError)
        return
      }

      setClientId(draft.client)

      const { data: draftData, error: draftFetchError } = await supabase
        .from('saip_quote_drafts')
        .select('items')
        .eq('id', draftId)
        .single()

      if (draftFetchError) {
        console.error('❌ Failed to load draft items:', draftFetchError)
      } else if (draftData?.items) {
        setItems(draftData.items)
      }
    }

    fetchClientId()
  }, [draftId, initialItems, supabase, currentUser])

  const handleItemChange = (index: number, field: keyof PackageItem, value: any) => {
    const updated = [...items]
    const currentItem = updated[index]
    const updatedItem = { ...currentItem, [field]: value }

    if (field === 'quantity' || field === 'price') {
      const price = field === 'price' ? value : currentItem.price || 0
      const quantity = field === 'quantity' ? value : currentItem.quantity || 1
      updatedItem.subtotal = price * quantity
    }

    updated[index] = updatedItem
    setItems(updated)
  }

  const handleAddProductFromSearch = (product: PackageItem) => {
    const enriched = {
      ...product,
      price: product.price || 0,
      subtotal: (product.price || 0) * (product.quantity || 1),
    }
    setItems([...items, enriched])
  }

  const handleRemoveItem = (index: number) => {
    const updated = [...items]
    updated.splice(index, 1)
    setItems(updated)
  }

  const handleSaveAndNext = async () => {
    // Calculate preferences: weight, volume, max dimensions
    const totalWeight = items.reduce(
      (sum, item) => sum + ((item.weight_lbs || 0) * (item.quantity || 1)),
      0
    )
    const totalVolume = items.reduce(
      (sum, item) =>
        sum +
        ((item.length && item.width && item.height
          ? item.length * item.width * item.height
          : 0) *
          (item.quantity || 1)),
      0
    )
    const maxLength = items.length > 0 ? Math.max(...items.map(item => item.length || 0)) : 0
    const maxWidth = items.length > 0 ? Math.max(...items.map(item => item.width || 0)) : 0
    const maxHeight = items.length > 0 ? Math.max(...items.map(item => item.height || 0)) : 0
    const preferences = {
      weight: totalWeight,
      volume: totalVolume,
      max_length: maxLength,
      max_width: maxWidth,
      max_height: maxHeight,
    }
    const { error } = await supabase
      .from('saip_quote_drafts')
      .update({ items, preferences })
      .eq('id', draftId)

    if (error) {
      console.error('❌ Failed to save quote items:', error)
      return
    }

    onNext()
  }

  return (
    <div className="space-y-6 p-4 bg-white">
        <div className="flex justify-between">
      <h2 className="text-xl font-semibold">Package Details</h2>
      <Button size="sm" onClick={() => setShowProductSearchModal(true)}>
            + Search Product
          </Button></div>

      {items.length === 0 && (
        <p className="text-muted-foreground italic">
          No package items added yet. Click “+ Search Product” to start.
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>SKU</Label>
              <Input
                value={item.sku} disabled
                onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
              />
            </div>
            <div>
              <Label>Product Name</Label>
              <Input
                value={item.product_name || ''} disabled
                onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="text"
                value={(item.price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                onChange={(e) => {
                  const numericValue = parseFloat(e.target.value.replace(/[^0-9.-]+/g, ''))
                  handleItemChange(index, 'price', numericValue)
                }}
              />
            </div>
            <div>
              <Label>Subtotal</Label>
              <Input
                type="text"
                value={(item.subtotal || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                disabled
              />
            </div></div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>Length (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={String(item.length ?? 0)}
                  onChange={(e) => handleItemChange(index, 'length', parseFloat(e.target.value.replace(',', '.')))}
                />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={String(item.width ?? 0)}
                  onChange={(e) => handleItemChange(index, 'width', parseFloat(e.target.value.replace(',', '.')))}
                />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={String(item.height ?? 0)}
                  onChange={(e) => handleItemChange(index, 'height', parseFloat(e.target.value.replace(',', '.')))}
                />
              </div>
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={String(item.weight_lbs ?? 0)}
                  onChange={(e) => handleItemChange(index, 'weight_lbs', parseFloat(e.target.value.replace(',', '.')))}
                />
              </div>
            </div>
           <div className="text-right">
             <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
               Remove
             </Button>
           </div>
          </div>
       
      ))}

      <div className="text-right font-semibold text-lg">
        Total: {(items.reduce((acc, item) => acc + (item.subtotal || 0), 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => setShowProductSearchModal(true)}>
            + Search Product
          </Button>
          <Button onClick={handleSaveAndNext} disabled={items.length === 0}>
            Next →
          </Button>
        </div>
      </div>

      <ProductSearchModal
        show={showProductSearchModal}
        onClose={() => setShowProductSearchModal(false)}
        onAddProduct={handleAddProductFromSearch}
        clientId={clientId}
      />
    </div>
  )
}