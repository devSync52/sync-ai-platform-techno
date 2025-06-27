'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCallback } from 'react'

export type Address = {
  address_line_1: string
  city: string
  state: string
  country: string
}

export type AccountType = {
  id: string
  label: string
}

export type CompanyFormProps = {
  name: string
  nameChanged: (val: string) => void
  email: string
  emailChanged: (val: string) => void
  taxId: string
  taxIdChanged: (val: string) => void
  phone: string
  phoneChanged: (val: string) => void
  zip: string
  zipChanged: (val: string) => void
  address: Address
  addressChanged: (val: Address) => void
  accountType: string | null
  accountTypeChanged: (val: string) => void
  accountTypes: AccountType[]
  saving: boolean
  submitForm: () => void
}

export function CompanyForm({
  name, nameChanged,
  email, emailChanged,
  taxId, taxIdChanged,
  phone, phoneChanged,
  zip, zipChanged,
  address, addressChanged,
  accountType, accountTypeChanged,
  accountTypes,
  saving, submitForm,
}: CompanyFormProps) {
  const formatPhone = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{1})(\d{3})(\d{3})(\d{4}).*/, '+$1 ($2) $3-$4')

  const formatTaxId = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{2})(\d{7})/, '$1-$2')

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => nameChanged(e.target.value), [nameChanged])
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => emailChanged(e.target.value), [emailChanged])
  const handleTaxIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => taxIdChanged(formatTaxId(e.target.value)), [taxIdChanged])
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => phoneChanged(formatPhone(e.target.value)), [phoneChanged])
  const handleZipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => zipChanged(e.target.value), [zipChanged])
  const handleAddressChange = useCallback(
    (field: keyof Address, value: string) => addressChanged({ ...address, [field]: value }),
    [address, addressChanged]
  )

  return (
    <form className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">Company Name</label>
            <Input value={name} onChange={handleNameChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Account Type</label>
            <Select value={accountType || ''} onValueChange={accountTypeChanged}>
              <SelectTrigger className="h-9 rounded-md border px-3 py-2 text-sm">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent className="text-sm">
                {accountTypes.map((type) => (
                  <SelectItem
                    key={type.id}
                    value={type.id}
                    className="text-sm px-3 py-2 hover:bg-muted focus:bg-muted"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <Input type="email" value={email} onChange={handleEmailChange} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Tax ID</label>
            <Input value={taxId} onChange={handleTaxIdChange} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Phone</label>
            <Input value={phone} onChange={handlePhoneChange} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">ZIP Code</label>
            <Input value={zip} onChange={handleZipChange} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Address</label>
            <Input value={address.address_line_1} onChange={(e) => handleAddressChange('address_line_1', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">City</label>
            <Input value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">State</label>
            <Input value={address.state} onChange={(e) => handleAddressChange('state', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Country</label>
            <Input value={address.country} onChange={(e) => handleAddressChange('country', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button onClick={submitForm} disabled={saving} className="px-6 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white">
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Save Settings
        </Button>
      </div>
    </form>
  )
}