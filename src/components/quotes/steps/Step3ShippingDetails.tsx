'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateQuoteDraft } from '@/lib/supabase/quotes'

type Props = {
  draftId: string
  onNext: () => void
  onBack: () => void
  initialShipTo?: any
  initialPreferences?: any
}

export default function Step3ShippingDetails({ draftId, onNext, onBack, initialShipTo, initialPreferences }: Props) {
  const [zip, setZip] = useState('')
  const [loadingZip, setLoadingZip] = useState(false)
  const [address, setAddress] = useState({
    full_name: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
  })

useEffect(() => {
  if (initialShipTo && typeof initialShipTo === 'object') {
    const updatedAddress = {
      full_name: initialShipTo.full_name || '',
      email: initialShipTo.email || '',
      address_line1: initialShipTo.address_line1 || initialShipTo.address_1 || '',
      address_line2: initialShipTo.address_line2 || '',
      city: initialShipTo.city || '',
      state: initialShipTo.state || '',
      country: initialShipTo.country || '',
      zip_code: initialShipTo.zip_code || initialShipTo.zip || '',
    }

    setAddress(updatedAddress)
    setZip(updatedAddress.zip_code)
  }
}, [initialShipTo, draftId])

  useEffect(() => {
    if (initialPreferences) {
      // Exemplo: se tiver campos como "shippingMethod" ou "insurance"
      // setShippingMethod(initialPreferences.shippingMethod || '')
      // setInsurance(initialPreferences.insurance || false)
    }
  }, [initialPreferences])

  const handleZipLookup = async () => {
    if (!zip) return
    setLoadingZip(true)
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) throw new Error('ZIP not found')
      const data = await res.json()
      const place = data.places?.[0]
      setAddress(prev => ({
        ...prev,
        city: place['place name'],
        state: place['state abbreviation'],
        country: data.country,
        zip_code: zip,
      }))
    } catch (err) {
      toast.error('ZIP code not found')
    } finally {
      setLoadingZip(false)
    }
  }

  const handleSave = async () => {
    try {
      await updateQuoteDraft(draftId, {
        ship_to: address,
      })
      toast.success('Ship to address saved')
      onNext()
    } catch (err) {
      toast.error('Failed to save address')
    }
  }

  return (
    <div className="space-y-6 p-4 bg-white">
      <h2 className="text-lg font-semibold">Shipping Origin (Ship To)</h2>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

        <div className="flex gap-2">
          <Input
            value={address.zip_code}
            onChange={e => {
              setAddress(prev => ({ ...prev, zip_code: e.target.value }))
              setZip(e.target.value)
            }}
            placeholder="ZIP code"
          />
          <Button onClick={handleZipLookup} disabled={loadingZip}>
            {loadingZip ? 'Searching...' : 'Lookup'}
          </Button>
        </div>

        <Input
          value={address.address_line1}
          onChange={e => setAddress(prev => ({ ...prev, address_line1: e.target.value }))}
          placeholder="Address Line 1"
        />

        <Input
          value={address.address_line2}
          onChange={e => setAddress(prev => ({ ...prev, address_line2: e.target.value }))}
          placeholder="Address Line 2 (Optional)"
        />

        <Input
          value={address.city}
          onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))}
          placeholder="City"
        />

        <Input
          value={address.state}
          onChange={e => setAddress(prev => ({ ...prev, state: e.target.value }))}
          placeholder="State"
        />

        <Input
          value={address.country}
          onChange={e => setAddress(prev => ({ ...prev, country: e.target.value }))}
          placeholder="Country"
        />
        <h2 className="text-lg font-semibold">Contact data</h2>
                <Input
          value={address.full_name || ''}
          onChange={e => setAddress(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Full Name"
        />
        <Input
          value={address.email || ''}
          onChange={e => setAddress(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          type="email"
        />
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave}>Next</Button>
      </div>
    </div>
  )
}