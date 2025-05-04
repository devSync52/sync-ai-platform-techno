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
}) {
  const formatPhone = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{1})(\d{3})(\d{3})(\d{4}).*/, '+$1 ($2) $3-$4')

  const formatTaxId = (val: string) =>
    val.replace(/\D/g, '')
      .replace(/^(\d{2})(\d{7})/, '$1-$2')

  return (
    <form className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">Company Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
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
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">ZIP Code</label>
            <Input value={zip} onChange={(e) => handleZipChange(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Address</label>
            <Input
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
      </div>

      <div className="pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="px-6 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white">
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Save Settings
        </Button>
      </div>
    </form>
  )
}
