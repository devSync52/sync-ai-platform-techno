'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { toast } from 'sonner'
import { integrationFields } from './integrationFields'
import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'

interface Field {
  name: string
  label: string
  type: string
}

interface Props {
  open: boolean
  handleClose: () => void
  accountId: string
  type: keyof typeof integrationFields
  existingData?: {
    credentials?: string
  }
  handleSaved: () => void
}

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_CREDENTIAL_SECRET || 'SYNC_SECRET'

export default function IntegrationModal({
  open,
  handleClose,
  accountId,
  type,
  existingData,
  handleSaved
}: Props) {
  const supabase = useSupabase()
  const fields = useMemo(() => integrationFields[type] || [], [type])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initialData: Record<string, string> = {}
    let creds: Record<string, string> = {}

    try {
      if (existingData?.credentials && typeof existingData.credentials === 'string') {
        const decrypted = AES.decrypt(existingData.credentials, ENCRYPTION_KEY).toString(Utf8)
        creds = JSON.parse(decrypted)
      }
    } catch (err) {
      console.error('❌ Failed to decrypt credentials:', err)
    }

    fields.forEach((field: Field) => {
      initialData[field.name] = creds[field.name] || ''
    })

    setFormData(initialData)
  }, [existingData, fields])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    const encrypted = AES.encrypt(
      JSON.stringify(formData),
      ENCRYPTION_KEY
    ).toString()

    const { error } = await supabase.from('account_integrations').upsert(
      {
        account_id: accountId,
        type,
        credentials: encrypted,
        status: 'active'
      },
      {
        onConflict: 'account_id,type'
      }
    )

    setLoading(false)

    if (error) {
      toast.error('Error saving integration')
    } else {
      toast.success('Integration saved')
      handleSaved()
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Configure {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fields.map((field: Field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full mt-4 bg-black text-white py-2 rounded-md text-sm hover:bg-gray-900 transition"
          >
            {loading ? 'Saving...' : 'Save Integration'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}