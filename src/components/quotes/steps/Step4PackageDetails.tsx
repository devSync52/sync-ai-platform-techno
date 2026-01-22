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
import { computeMultiBoxFromItems } from '@/lib/shipping/multibox'

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
  warehouseId,
  shipFromName,
}: {
  show: boolean
  onClose: () => void
  onAddProduct: (product: PackageItem) => void
  clientId: string
  warehouseId?: string
  shipFromName?: string
}) {

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!clientId || !warehouseId) return
  
    console.log('[Step4][ProductSearch] Searching products (SSR)', {
      clientId,
      warehouseId,
      searchTerm,
      shipFromName,
    })
  
    setLoading(true)
  
    try {
      const params = new URLSearchParams({
        clientId,
        shipFromName: shipFromName || '',
        term: searchTerm || '',
      })
  
      const res = await fetch(`/api/products/search?${params.toString()}`, {
        credentials: 'include',
      })
  
      const json = await res.json().catch(() => ({}))
  
      if (!res.ok) {
        console.error('[Step4][ProductSearch] SSR search failed', json)
        setResults([])
        return
      }
  
      setResults(json?.products || [])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (product: any) => {
    const length = Number(product.pkg_length_in ?? 0)
    const width = Number(product.pkg_width_in ?? 0)
    const height = Number(product.pkg_height_in ?? 0)
    const weight = Number(product.pkg_weight_lb ?? 0)

    const packageItem: PackageItem = {
      sku: product.sku,
      product_name: product.description || '',
      quantity: 1,
      length,
      width,
      height,
      weight_lbs: weight,
      stackable: false,
      hazardous: false,
      freight_class: '',
      // vw_products_master_enriched não tem preço, então deixamos 0 por padrão
      price: 0,
      subtotal: 0,
    }
    onAddProduct(packageItem)
    onClose()
  }

  if (!show) return null

  const warehouseMissing = !warehouseId

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white md:rounded-md rounded-none p-4 md:p-6 w-full md:w-[90vw] max-w-3xl h-[100dvh] md:h-auto md:max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Search Products</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none">
            ×
          </button>
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
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
          <Button className="w-full sm:w-auto" onClick={handleSearch} disabled={loading || warehouseMissing}>
            {warehouseMissing ? 'Select a warehouse first' : loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div>
          {warehouseMissing && (
            <p className="text-sm text-amber-700 mb-2">
              Warehouse not selected yet. Go back to Step 2 and select a Ship From warehouse.
            </p>
          )}
          {results.length === 0 && !loading && <p className="text-muted-foreground">No products found.</p>}
          <ul className="divide-y divide-gray-200 max-h-64 overflow-auto">
            {results.map((product, idx) => (
              <li key={idx} className="py-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{product.description || product.sku}</p>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-500">
                    Available: {Number(product.available ?? 0).toLocaleString('en-US')}
                    {product.on_hand != null ? ` · On hand: ${Number(product.on_hand ?? 0).toLocaleString('en-US')}` : ''}
                    {product.allocated != null ? ` · Allocated: ${Number(product.allocated ?? 0).toLocaleString('en-US')}` : ''}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => handleAdd(product)}
                  disabled={Number(product.available ?? 0) <= 0}
                >
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
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [shipFromName, setShipFromName] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)

  const supabase = useSupabase()
  const currentUser = useCurrentUser()

  useEffect(() => {
    async function fetchClientId() {
      if (!currentUser?.account_id) return

      const { data: draft, error: draftError } = await supabase
        .from('saip_quote_drafts')
        .select('client, ship_from')
        .eq('id', draftId)
        .single()

      if (draftError || !draft?.client) {
        console.error('❌ Failed to fetch client ID:', draftError)
        return
      }

      setClientId(draft.client)
      const wh = (draft as any)?.ship_from?.warehouse_id ?? (draft as any)?.ship_from?.warehouseId ?? ''
      const shipName = (draft as any)?.ship_from?.name ?? ''
      setWarehouseId(String(wh || ''))
      setShipFromName(String(shipName || ''))
      console.log('[Step4] Draft context loaded', {
        draftId,
        clientId: String(draft.client),
        warehouseId: String(wh || ''),
        shipFromName: String(shipName || ''),
        shipFrom: (draft as any)?.ship_from ?? null,
      })

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
    setIsCalculating(true)
    try {
      const itemsForCalc = items.map((item) => ({
        length: item.length,
        width: item.width,
        height: item.height,
        weight_lbs: item.weight_lbs,
        quantity: item.quantity,
      }))
  
      const { totalWeight, totalVolume, box } = computeMultiBoxFromItems(itemsForCalc as any, {
        maxWeightPerBox: 145,
        maxLengthPlusGirth: 165,
      })
  
      const maxLength = items.length > 0 ? Math.max(...items.map((i) => i.length || 0)) : 0
      const maxWidth = items.length > 0 ? Math.max(...items.map((i) => i.width || 0)) : 0
      const maxHeight = items.length > 0 ? Math.max(...items.map((i) => i.height || 0)) : 0
  
      console.log('[MULTIBOX][Step4] Preview box from items:', {
        totalWeight,
        totalVolume,
        box,
      })
  
      const optimizedPackages = [
        {
          sku: 'mixed',
          length: Number(box.length.toFixed(2)),
          width: Number(box.width.toFixed(2)),
          height: Number(box.height.toFixed(2)),
          weight: Number(box.weightPerBox.toFixed(2)),
          quantity: box.boxCount,
          package_type: true,
        },
      ]

      const preferences = {
        // Totais da carga
        weight: Number(totalWeight.toFixed(2)),
        volume: Number(totalVolume.toFixed(2)),

        // Dimensões máximas de item (para referência)
        max_length: Number(maxLength.toFixed(2)),
        max_width: Number(maxWidth.toFixed(2)),
        max_height: Number(maxHeight.toFixed(2)),

        // Dimensões da caixa calculada (multi-box)
        length: Number(box.length.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        box_count: box.boxCount,

        // Pacote "ótimo" para consumo no passo 5
        optimized_packages: optimizedPackages,

        // Outros campos existentes
        residential: false,
        confirmation: '',
        package_type: '',
        service_class: '',
      }
  
      const { error } = await supabase
        .from('saip_quote_drafts')
        .update({
          items,
          preferences,
          // Always clear previous quote results when package details change
          quote_results: null,
        })
        .eq('id', draftId)
  
      if (error) {
        console.error('❌ Failed to save quote items:', error)
        return
      }
    
      
    
      onNext()
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="space-y-4 p-3 md:p-4 bg-white min-h-[60vh] pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold sm:text-xl">Package Details</h2>
      <Button
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => {
          if (!warehouseId) {
            alert('Please select a Ship From warehouse in Step 2 before searching products.')
            return
          }
          setShowProductSearchModal(true)
        }}
      >
        + Search Product
      </Button>
    </div>

      {items.length === 0 && (
        <p className="text-muted-foreground italic">
          No package items added yet. Click “+ Search Product” to start.
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="border rounded-md p-3 md:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
  type="number"
  step="0.01"
  value={item.price ?? ''}
  onChange={(e) => {
    const numericValue = parseFloat(e.target.value)
    handleItemChange(index, 'price', isNaN(numericValue) ? null : numericValue)
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
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
           <div className="flex justify-end">
             <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
               Remove
             </Button>
           </div>
          </div>
       
      ))}

      <div className="text-right font-semibold text-base sm:text-lg">
        Total: {(items.reduce((acc, item) => acc + (item.subtotal || 0), 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (!warehouseId) {
                alert('Please select a Ship From warehouse in Step 2 before searching products.')
                return
              }
              setShowProductSearchModal(true)
            }}
          >
            + Search Product
          </Button>
          <Button onClick={handleSaveAndNext} disabled={items.length === 0 || isCalculating}>
            {isCalculating ? 'Calculating package...' : 'Next'}
          </Button>
        </div>
      </div>
      {/* Mobile sticky actions */}
      <div className="md:hidden sticky bottom-[env(safe-area-inset-bottom)] -mx-3 mt-4 border-t bg-background/95 backdrop-blur px-3 py-3 flex gap-2">
        <Button variant="outline" className="w-1/3" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="secondary"
          className="w-1/3"
          onClick={() => {
            if (!warehouseId) {
              alert('Please select a Ship From warehouse in Step 2 before searching products.')
              return
            }
            setShowProductSearchModal(true)
          }}
        >
          + Product
        </Button>
        <Button className="w-1/3" onClick={handleSaveAndNext} disabled={items.length === 0 || isCalculating}>
          {isCalculating ? 'Calculating…' : 'Next'}
        </Button>
      </div>

      <ProductSearchModal
        show={showProductSearchModal}
        onClose={() => setShowProductSearchModal(false)}
        onAddProduct={handleAddProductFromSearch}
        clientId={clientId}
        warehouseId={warehouseId}
        shipFromName={shipFromName}
      />
    </div>
  )
}