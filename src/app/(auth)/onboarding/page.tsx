'use client'

import { useEffect, useState } from 'react'
import { useSession, useSupabase } from '@/components/supabase-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { Building, MapPin } from 'lucide-react'

export default function OnboardingPage() {
  const session = useSession()
  const supabase = useSupabase()
  const router = useRouter()

  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [addressVisible, setAddressVisible] = useState(false)

  const handleZipSearch = async () => {
    if (!zip || zip.length < 5) return
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
      if (!res.ok) throw new Error('ZIP not found')
      const data = await res.json()
      setCity(data.places?.[0]?.['place name'] || '')
      setState(data.places?.[0]?.['state abbreviation'] || '')
      setCountry(data.country || 'US')
      setAddressVisible(true)
    } catch (err) {
      toast.error('ZIP code not found')
    }
  }

  useEffect(() => {
    if (zip.length >= 5) handleZipSearch()
  }, [zip])

  const handleSubmit = async () => {
    if (!session?.user?.id || !company || !phone) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: session.user.id,
        email: session.user.email,
        account_name: company,
        phone,
        zip_code: zip,
        address_line_1: address1,
        address_line_2: address2,
        city,
        state,
        country,
      })
    })

    const result = await response.json()
    if (result.success) {
      toast.success('Welcome!')
    
      // ✅ Aguarda até que o Supabase reflita o account_id para esse usuário
      const maxTries = 10
      let tries = 0
      let confirmed = false
    
      while (tries < maxTries && !confirmed) {
        const { data: userCheck, error } = await supabase
          .from('users')
          .select('account_id')
          .eq('id', session.user.id)
          .maybeSingle()
    
        if (userCheck?.account_id) {
          confirmed = true
          break
        }
    
        await new Promise((r) => setTimeout(r, 250)) // espera 250ms
        tries++
      }
    
      if (confirmed) {
        router.push('/dashboard')
      } else {
        toast.error('We couldn’t confirm your account setup. Try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-0 py-0 bg-gradient-to-br from-primary to-primary text-gray-900">
      <div className="mb-6">
        <Image src="/sync-ai-plataform-logo.svg" alt="SynC AI Logo" width={250} height={80} priority />
      </div>

      <div className="w-full max-w-md bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-5">
        <h1 className="text-2xl font-bold text-center text-primary">Complete your company profile</h1>

        <div className="relative">
          <Building className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Company Name"
            className="w-full border pl-10 pr-4 py-2 rounded text-sm"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <PhoneInput
          country={'us'}
          value={phone}
          onChange={setPhone}
          inputProps={{ required: true }}
          inputClass="!w-full !pl-10 !py-2 !text-sm border rounded"
          containerClass="relative"
          buttonClass="!border-none !bg-transparent"
        />

        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="ZIP Code"
            className="w-full border pl-10 pr-4 py-2 rounded text-sm"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
        </div>

        {addressVisible && (
          <>
            <input
              type="text"
              placeholder="Address Line 1"
              className="w-full border px-4 py-2 rounded text-sm"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />
            <input
              type="text"
              placeholder="Address Line 2"
              className="w-full border px-4 py-2 rounded text-sm"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />
            <input
              type="text"
              placeholder="City"
              className="w-full border px-4 py-2 rounded text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <input
              type="text"
              placeholder="State"
              className="w-full border px-4 py-2 rounded text-sm"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
            <input
              type="text"
              placeholder="Country"
              className="w-full border px-4 py-2 rounded text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-primary/90 flex items-center justify-center"
        >
          {loading ? 'Creating account...' : 'Finish Setup'}
        </button>
      </div>
    </div>
  )
}
