'use client'

import { useEffect, useState } from 'react'
import { useSupabase, useSession } from '@/components/supabase-provider'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { CompanyForm } from '@/components/client/company/CompanyForm'
import { Input } from '@/components/ui/input'
import { CompanyLogoUploader } from '@/components/ui/CompanyLogoUploader'
import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalTrigger } from '@/components/ui/modal'

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
  const [logo, setLogo] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userRecord, setUserRecord] = useState<{ account_id?: string; role?: string } | null>(null)

  const [openLogoModal, setOpenLogoModal] = useState(false)

  const handleLogoUpdate = (newUrl: string) => {
    setLogo(newUrl)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return
      const { data: types } = await supabase
        .from('account_types')
        .select('id, label')
        .order('label', { ascending: true })

      if (types) setAccountTypes(types)

      const { data: userRec } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', userId)
        .single()

      setUserRecord(userRec ?? null)

      if (!userRec?.account_id) {
        setLoading(false)
        return
      }

      setUserRole(userRec.role)

      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userRec.account_id)
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
      if (account.logo) setLogo(account.logo)

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
    if (userRole === 'staff-user') return

    setSaving(true)

    const { data: userRec } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    if (!userRec?.account_id) {
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
          created_by_user_id: userId,
          logo,
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
          type_id: accountType,
          logo,
        })
        .eq('id', userRec.account_id)

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
      <h1 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Company Settings</h1>

      <Card className="border shadow-md bg-white rounded-2xl">
        <CardContent className="pt-6">
          <div className="mb-6">
            {/* Show company logo if it exists */}
            {logo && (
              <div className="mb-4">
                <img
                  src={logo}
                  alt="Company Logo"
                  className="h-12 object-contain rounded"
                />
              </div>
            )}
            <Modal open={openLogoModal} onOpenChange={setOpenLogoModal}>
              <ModalTrigger asChild>
                <Button variant="outline" className="text-sm">
                  Edit Company Logo
                </Button>
              </ModalTrigger>
              <ModalContent className="max-w-xl">
                <h2 className="text-lg font-semibold mb-2">Upload Company Logo</h2>
              
                <CompanyLogoUploader
                  userId={userId ?? ''}
                  existingUrl={logo}
                  onUploadComplete={handleLogoUpdate}
                />
                {/* Remove Logo button 
                {logo && (
                  <div className="mt-4 text-right">
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        setLogo('')
                        toast.success('Logo removed. Remember to save changes.')
                      }}
                    >
                      Remove Logo
                    </Button>
                  </div>
                )}*/}
              </ModalContent>
            </Modal>
          </div>
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
            disabled={userRole === 'staff-user'}
          />
        </CardContent>
      </Card>
    </div>
  )
}