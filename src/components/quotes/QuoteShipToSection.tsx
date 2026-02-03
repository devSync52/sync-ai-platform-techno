


'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export function QuoteShipToSection() {
  const [form, setForm] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    residential: false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ship To (Recipient)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Recipient Name</Label>
          <Input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <Label>Address 1</Label>
          <Input name="address1" value={form.address1} onChange={handleChange} />
        </div>
        <div>
          <Label>Address 2</Label>
          <Input name="address2" value={form.address2} onChange={handleChange} />
        </div>
        <div>
          <Label>City</Label>
          <Input name="city" value={form.city} onChange={handleChange} />
        </div>
        <div>
          <Label>State</Label>
          <Input name="state" value={form.state} onChange={handleChange} />
        </div>
        <div>
          <Label>ZIP Code</Label>
          <Input name="zip" value={form.zip} onChange={handleChange} />
        </div>
        <div>
          <Label>Country</Label>
          <Input name="country" value={form.country} onChange={handleChange} />
        </div>
        <div className="col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="residential"
              checked={form.residential}
              onChange={handleChange}
            />
            <span>Residential Delivery</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}