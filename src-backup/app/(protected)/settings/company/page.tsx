'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import { CompanyForm } from './companyForm'

export default function SettingsPage() {
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

      try {
        const { data: types, error: typeErr } = await supabase
          .from('account_types')
          .select('id, label')
          .order('label', { ascending: true })

        if (typeErr) throw typeErr
        setAccountTypes(types || [])

        const { data: userRecord, error: userErr } = await supabase
          .from('users')
          .select('account_id')
          .eq('id', user.id)
          .single()

        if (userErr || !userRecord?.account_id) {
          setLoading(false)
          return
        }

        const { data: account, error: accErr } = await supabase
  .from('accounts')
  .select('*')
  .eq('id', userRecord.account_id)
  .maybeSingle()

if (accErr) throw accErr
if (!account) {
  toast.warning('No account found for this user.')
  setLoading(false)
  return
}

        if (accErr) throw accErr

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
    } catch (err: any) {
        console.error('❌ Error saving account:', err)
        toast.error(err?.message || 'Error saving account. Please try again.')
      }
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
      } catch (err) {
        console.warn('❗ ZIP code lookup failed.')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    if (!user) {
      toast.error('No user logged in.')
      setSaving(false)
      return
    }
  
    try {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single()
  
      if (userError) throw userError
  
      // If user has no account, create one and link to user
      if (!userRecord?.account_id) {
        const { data: createdAccount, error: insertError } = await supabase
          .from('accounts')
          .insert([{
            name,
            email,
            type_id: accountType,
            created_by_user_id: user.id,
            tax_id: taxId,
            phone,
            zip_code: zip,
            address_line_1: address.address_line_1,
            city: address.city,
            state: address.state,
            country: address.country
          }])
          .select()
          .single()
  
        if (insertError || !createdAccount?.id) {
          toast.error(insertError?.message || 'Failed to create account.')
          throw insertError || new Error('Account creation failed.')
        }
  
        const { error: updateUserError, data: updatedUser } = await supabase
          .from('users')
          .update({ account_id: createdAccount.id })
          .eq('id', user.id)
          .select()
          .maybeSingle()
  
        if (updateUserError || !updatedUser?.account_id) {
          toast.warning('Account created, but user was not linked.')
          throw updateUserError || new Error('Missing account_id after user update.')
        }
  
        toast.success('Account created successfully! 🎉')
      } else {
        // Update existing account
        const { error: updateError, data } = await supabase
          .from('accounts')
          .update({
            name,
            email,
            type_id: accountType,
            tax_id: taxId,
            phone,
            zip_code: zip,
            address_line_1: address.address_line_1,
            city: address.city,
            state: address.state,
            country: address.country
          })
          .eq('id', userRecord.account_id)
          .select()
          .maybeSingle()
  
        if (updateError) {
          toast.error(updateError.message || 'Failed to update account.')
          throw updateError
        }
  
        if (!data) {
          toast.warning('No changes were made to the account.')
        } else {
          toast.success('Account updated successfully! ✅')
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
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