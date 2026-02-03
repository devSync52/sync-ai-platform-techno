

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { QuoteActions } from '@/components/quotes/QuoteActions'

export function QuoteSummarySection() {
  const [productCost, setProductCost] = useState(100.0)
  const [freightCost, setFreightCost] = useState(25.0)
  const [markup, setMarkup] = useState(10.0)

  const totalPrice = productCost + freightCost + markup

  function handleSimulateRate() {
    console.log('🧪 Simulating freight...')
  }

  function handleConfirmOrder() {
    console.log('✅ Creating order...')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Product Cost</Label>
            <Input type="number" value={productCost} readOnly />
          </div>
          <div>
            <Label>Estimated Freight</Label>
            <Input type="number" value={freightCost} readOnly />
          </div>
          <div>
            <Label>Markup</Label>
            <Input type="number" value={markup} readOnly />
          </div>
        </div>
        <div className="mt-6">
          <Label>Total Price</Label>
          <Input type="number" value={totalPrice} readOnly className="font-bold text-xl" />
        </div>
        <QuoteActions
          onSimulateRate={handleSimulateRate}
          onConfirmOrder={handleConfirmOrder}
        />
      </CardContent>
    </Card>
  )
}