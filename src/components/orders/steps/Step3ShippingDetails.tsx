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
  onShipToSaved?: (shipTo: any) => void
}

export default function Step3ShippingDetails({
  draftId,
  onNext,
  onBack,
  initialShipTo,
  initialPreferences,
  onShipToSaved,
}: Props) {
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
  const shipToObj =
    initialShipTo && typeof initialShipTo === 'string'
      ? (() => {
          try {
            return JSON.parse(initialShipTo)
          } catch {
            return null
          }
        })()
      : initialShipTo

  if (shipToObj && typeof shipToObj === 'object') {
    const updatedAddress = {
      full_name: shipToObj.full_name || '',
      email: shipToObj.email || '',
      address_line1: shipToObj.address_line1 || shipToObj.address_1 || '',
      address_line2: shipToObj.address_line2 || '',
      city: shipToObj.city || '',
      state: shipToObj.state || '',
      country: shipToObj.country || '',
      zip_code: shipToObj.zip_code || shipToObj.zip || '',
    }

    setAddress(updatedAddress)
    setZip(updatedAddress.zip_code)
  }
}, [initialShipTo, draftId])

  // Auto-fill contact data from customer selection if draft has it.
  useEffect(() => {
    let isMounted = true
    const hydrateFromDraft = async () => {
      try {
        const res = await fetch(`/api/quotes/drafts/${draftId}`, {
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        const draft = json?.draft
        const rawShipTo = draft?.ship_to
        const shipToObj =
          rawShipTo && typeof rawShipTo === 'string'
            ? (() => {
                try {
                  return JSON.parse(rawShipTo)
                } catch {
                  return {}
                }
              })()
            : rawShipTo || {}

        const maybeFullName =
          shipToObj?.full_name ||
          shipToObj?.name ||
          shipToObj?.contact_name ||
          draft?.client_name ||
          ''
        const maybeEmail = shipToObj?.email || draft?.client_email || ''

        if (!isMounted) return
        setAddress((prev) => ({
          ...prev,
          full_name: prev.full_name || maybeFullName || '',
          email: prev.email || maybeEmail || '',
        }))
      } catch (err) {
        console.warn('⚠️ Could not hydrate ship_to contact from draft:', err)
      }
    }

    hydrateFromDraft()
    return () => {
      isMounted = false
    }
  }, [draftId, initialPreferences])

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
        city: place?.['place name'] ?? '',
        state: place?.['state abbreviation'] ?? '',
        // zippopotam.us returns country abbreviation at the top level, not inside places[0]
        country: data?.['country abbreviation'] ?? '',
        zip_code: zip,
      }))
    } catch (err) {
      toast.error('ZIP code not found')
    } finally {
      setLoadingZip(false)
    }
  }

  const handleSave = async () => {
    const requiredChecks: Array<{ key: string; label: string; value: string }> = [
      { key: 'zip_code', label: 'ZIP code', value: String(address.zip_code || '').trim() },
      { key: 'address_line1', label: 'Address Line 1', value: String(address.address_line1 || '').trim() },
      { key: 'city', label: 'City', value: String(address.city || '').trim() },
      { key: 'state', label: 'State', value: String(address.state || '').trim() },
      { key: 'country', label: 'Country', value: String(address.country || '').trim() },
      { key: 'full_name', label: 'Full Name', value: String(address.full_name || '').trim() },
      { key: 'email', label: 'Email', value: String(address.email || '').trim() },
    ]

    const missing = requiredChecks.filter((field) => !field.value).map((field) => field.label)
    if (missing.length > 0) {
      toast.error('Please fill all mandatory fields', {
        description: `Missing: ${missing.join(', ')}`,
      })
      return
    }

    const email = String(address.email || '').trim()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailOk) {
      toast.error('Invalid email', {
        description: 'Please enter a valid contact email address.',
      })
      return
    }

    try {
      const nextShipTo = {
        ...address,
        zip_code: String(address.zip_code || '').trim(),
        address_line1: String(address.address_line1 || '').trim(),
        address_line2: String(address.address_line2 || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        country: String(address.country || '').trim().toUpperCase(),
        full_name: String(address.full_name || '').trim(),
        email,
      }

      await updateQuoteDraft(draftId, {
        ship_to: nextShipTo,
        step: 3,
      })
      if (onShipToSaved) onShipToSaved(nextShipTo)
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
          onChange={e =>
            setAddress(prev => ({
              ...prev,
              country: e.target.value.slice(0, 4)
            }))
          }
          placeholder="Country (e.g. US)"
          maxLength={4}
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
