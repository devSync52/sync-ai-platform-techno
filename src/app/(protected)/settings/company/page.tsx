'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CompanyForm } from './companyForm'
import { toast } from 'sonner'

export default function CompanySettingsPage() {
  const supabase = useSupabaseClient()
  const user = useUser()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [accountType, setAccountType] = useState<string>('')
  const [accountTypes, setAccountTypes] = useState<{ id: string; label: string }[]>([])
  const [address, setAddress] = useState({
    address_line_1: '',
    city: '',
    state: '',
    country: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      const { data: types } = await supabase.from('account_types').select('id, label').order('label', { ascending: true })
      if (types) setAccountTypes(types)

      const { data: userRecord } = await supabase.from('users').select('account_id').eq('id', user.id).single()
      if (!userRecord?.account_id) return setLoading(false)

      const { data: account } = await supabase.from('accounts').select('*').eq('id', userRecord.account_id).maybeSingle()
      if (!account) return setLoading(false)

      setName(account.name || '')
      setEmail(account.email || '')
      setTaxId(account.tax_id || '')
      setPhone(account.phone || '')
      setZip(account.zip_code || '')
      setAccountType(account.type_id || '')
      setAddress({
        address_line_1: account.address_line_1 || '',
        city: account.city || '',
        state: account.state || '',
        country: account.country || ''
      })

      setLoading(false)
    }

    fetchData()
  }, [supabase, user])

  const handleZipChange = async (value: string) => {
    setZip(value)
    if (value.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${value}`)
        const data = await res.json()
        if (data?.places?.length > 0) {
          const place = data.places[0]
          setAddress({
            ...address,
            city: place['place name'],
            state: place['state abbreviation'],
            country: data['country abbreviation'],
          })
        }
      } catch {
        console.warn('ZIP lookup failed.')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)

    const { data: userRecord } = await supabase.from('users').select('account_id').eq('id', user?.id).single()

    if (!userRecord?.account_id) {
      const { data: created, error } = await supabase.from('accounts').insert([{
        name, email, tax_id: taxId, phone, zip_code: zip,
        address_line_1: address.address_line_1,
        city: address.city,
        state: address.state,
        country: address.country,
        type_id: accountType,
        created_by_user_id: user?.id
      }]).select().single()

      if (error || !created?.id) return toast.error('Could not create account.')

      await supabase.from('users').update({ account_id: created.id }).eq('id', user?.id)
      toast.success('Account created successfully.')
    } else {
      const { error } = await supabase.from('accounts').update({
        name, email, tax_id: taxId, phone, zip_code: zip,
        address_line_1: address.address_line_1,
        city: address.city,
        state: address.state,
        country: address.country,
        type_id: accountType,
      }).eq('id', userRecord.account_id)

      if (error) return toast.error('Failed to update account.')
      toast.success('Company updated!')
    }

    setSaving(false)
  }

  return (
    <div className="max-w-8xl mx-auto p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">Company Settings</h1>
  
      <Card className="border shadow-md rounded-2xl">
        <CardContent className="pt-6">
          <CompanyForm
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            taxId={taxId}
            setTaxId={setTaxId}
            phone={phone}
            setPhone={setPhone}
            zip={zip}
            handleZipChange={handleZipChange}
            address={address}
            setAddress={setAddress}
            accountType={accountType}
            setAccountType={setAccountType}
            accountTypes={accountTypes}
            saving={saving}
            handleSave={handleSave}
          />
        </CardContent>
      </Card>
    </div>
  )
}