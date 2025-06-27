'use client'

import { useEffect, useState } from 'react'
import { useSupabase, useSession } from '@/components/supabase-provider'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { CompanyForm } from '@/components/client/company/CompanyForm'

export default function CompanySettingsPage() {
  const supabase = useSupabase()
  const session = useSession()
  const userId = session?.user?.id

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
      if (!userId) return
      const { data: types } = await supabase
        .from('account_types')
        .select('id, label')
        .order('label', { ascending: true })

      if (types) setAccountTypes(types)

      const { data: userRecord } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', userId)
        .single()

      if (!userRecord?.account_id) {
        setLoading(false)
        return
      }

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userRecord.account_id)
        .maybeSingle()

      if (!account) {
        setLoading(false)
        return
      }

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
  }, [supabase, userId])

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
    if (!userId) return

    setSaving(true)

    const { data: userRecord } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (!userRecord?.account_id) {
      const { data: created, error } = await supabase
        .from('accounts')
        .insert([{
          name,
          email,
          tax_id: taxId,
          phone,
          zip_code: zip,
          address_line_1: address.address_line_1,
          city: address.city,
          state: address.state,
          country: address.country,
          type_id: accountType,
          created_by_user_id: userId
        }])
        .select()
        .single()

      if (error || !created?.id) {
        toast.error('Could not create account.')
        setSaving(false)
        return
      }

      await supabase
        .from('users')
        .update({ account_id: created.id })
        .eq('id', userId)

      toast.success('Account created successfully.')
    } else {
      const { error } = await supabase
        .from('accounts')
        .update({
          name,
          email,
          tax_id: taxId,
          phone,
          zip_code: zip,
          address_line_1: address.address_line_1,
          city: address.city,
          state: address.state,
          country: address.country,
          type_id: accountType
        })
        .eq('id', userRecord.account_id)

      if (error) {
        toast.error('Failed to update account.')
        setSaving(false)
        return
      }

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
  nameChanged={setName}
  email={email}
  emailChanged={setEmail}
  taxId={taxId}
  taxIdChanged={setTaxId}
  phone={phone}
  phoneChanged={setPhone}
  zip={zip}
  zipChanged={handleZipChange}
  address={address}
  addressChanged={setAddress}
  accountType={accountType}
  accountTypeChanged={setAccountType}
  accountTypes={accountTypes}
  saving={saving}
  submitForm={handleSave}
/>
        </CardContent>
      </Card>
    </div>
  )
}