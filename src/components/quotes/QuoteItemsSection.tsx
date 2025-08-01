'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrashIcon } from 'lucide-react'

type QuoteItem = {
  id: string
  sku: string
  productName: string
  quantity: number
  length: number
  width: number
  height: number
  weight: number
}

export function QuoteItemsSection() {
  const [items, setItems] = useState<QuoteItem[]>([])

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sku: '',
        productName: '',
        quantity: 1,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
      },
    ])
  }

  function handleChange(index: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) => {
      const updated = [...prev]
      ;(updated[index] as any)[field] = typeof value === 'string' && field !== 'sku' && field !== 'productName'
        ? parseFloat(value)
        : value
      return updated
    })
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Items</CardTitle>
        <Button size="sm" onClick={handleAddItem}>+ Add Item</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-md">
            <div>
              <Label>SKU</Label>
              <Input
                value={item.sku}
                onChange={(e) => handleChange(index, 'sku', e.target.value)}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleChange(index, 'quantity', e.target.value)}
              />
            </div>
            <div>
              <Label>Dimensions (LxWxH)</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="L"
                  value={item.length}
                  onChange={(e) => handleChange(index, 'length', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="W"
                  value={item.width}
                  onChange={(e) => handleChange(index, 'width', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="H"
                  value={item.height}
                  onChange={(e) => handleChange(index, 'height', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between items-end gap-2">
              <div className="w-full">
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={item.weight}
                  onChange={(e) => handleChange(index, 'weight', e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                <TrashIcon className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}