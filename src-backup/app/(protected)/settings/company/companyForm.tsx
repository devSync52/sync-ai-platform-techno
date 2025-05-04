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

type Address = {
    address_line_1: string
    city: string
    state: string
    country: string
  }

type Props = {
  name: string
  setName: (val: string) => void
  email: string
  setEmail: (val: string) => void
  taxId: string
  setTaxId: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  zip: string
  handleZipChange: (val: string) => void
  address: {
    address_line_1: string
    city: string
    state: string
    country: string
  }
  setAddress: (addr: Address) => void
  accountType: string
  setAccountType: (val: string) => void
  accountTypes: { id: string; label: string }[]
  saving: boolean
  handleSave: () => void
}

export function CompanyForm({
  name, setName,
  email, setEmail,
  taxId, setTaxId,
  phone, setPhone,
  zip, handleZipChange,
  address, setAddress,
  accountType, setAccountType,
  accountTypes,
  saving, handleSave,
}: Props) {
  const formatPhone = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{1})(\d{3})(\d{3})(\d{4}).*/, '+$1 ($2) $3-$4')

  const formatTaxId = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{2})(\d{7})/, '$1-$2')

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm text-gray-700">Company Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {accountTypes.length > 0 && (
        <div>
          <label className="text-sm text-gray-700">Account Type</label>
          <Select
            value={accountType || ''}
            onValueChange={(val) => setAccountType(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <label className="text-sm text-gray-700">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <label className="text-sm text-gray-700">Tax ID</label>
        <Input value={taxId} onChange={(e) => setTaxId(formatTaxId(e.target.value))} />
      </div>

      <div>
        <label className="text-sm text-gray-700">Phone</label>
        <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
      </div>

      <div>
        <label className="text-sm text-gray-700">ZIP Code</label>
        <Input value={zip} onChange={(e) => handleZipChange(e.target.value)} />
      </div>

      <div>
        <label className="text-sm text-gray-700">Address</label>
        <Input
          placeholder="Address Line 1"
          value={address.address_line_1}
          onChange={(e) => setAddress({ ...address, address_line_1: e.target.value })}
        />
      </div>

      
        <div>
          <label className="text-sm text-gray-700">City</label>
          <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-700">State</label>
          <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
        </div>
      

      <div>
        <label className="text-sm text-gray-700">Country</label>
        <Input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
      </div>

      
</div>
      <div className="pt-4">
      <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Save Settings
        </Button>
      </div>
    </div>
  )
}