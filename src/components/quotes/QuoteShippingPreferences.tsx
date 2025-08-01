


'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function QuoteShippingPreferences() {
  const [form, setForm] = useState({
    shippingMode: 'courier',
    carrier: '',
    shipDate: '',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Preferences</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Shipping Mode</Label>
          <Select
            value={form.shippingMode}
            onValueChange={(value) => setForm((prev) => ({ ...prev, shippingMode: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="courier">Courier (Box)</SelectItem>
              <SelectItem value="ltl">LTL (Pallet)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Carrier Preference</Label>
          <Select
            value={form.carrier}
            onValueChange={(value) => setForm((prev) => ({ ...prev, carrier: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="fedex">FedEx</SelectItem>
              <SelectItem value="ups">UPS</SelectItem>
              <SelectItem value="project44">Project44</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ship Date</Label>
          <Input
            type="date"
            value={form.shipDate}
            onChange={(e) => setForm((prev) => ({ ...prev, shipDate: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  )
}