'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type UserFormProps = {
  name: string
  setName: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  saving: boolean
  handleSave: () => void
}

export function UserForm({
  name, setName,
  phone, setPhone,
  saving, handleSave,
}: UserFormProps) {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-700">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Email</label>
          
        </div>
        <div>
          <label className="text-sm text-gray-700">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Photo URL</label>
          
        </div>
        <div>
          <label className="text-sm text-gray-700">New Password</label>
          
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white"
        >
          {saving && <Loader2 className="animate-spin mr-2" size={18} />}
          Save Profile
        </Button>
      </div>
    </form>
  )
}