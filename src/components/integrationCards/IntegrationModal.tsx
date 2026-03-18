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
  const [testing, setTesting] = useState(false)
  const [isTestPassed, setIsTestPassed] = useState(false)

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
    setIsTestPassed(false)
  }, [existingData, fields])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (type === 'sellercloud' || type === 'extensiv' || type === 'fedex' || type === 'ups') {
      setIsTestPassed(false)
    }
  }

  const getMissingField = () => fields.find((field: Field) => !String(formData[field.name] || '').trim())

  const handleTest = async () => {
    const missingField = getMissingField()
    if (missingField) {
      toast.error(`${missingField.label} is required`)
      return
    }

    setTesting(true)

    try {
      const testUrl =
        type === 'sellercloud'
          ? '/api/integrations/sellercloud'
          : type === 'extensiv'
            ? '/api/integrations/extensiv'
            : type === 'fedex'
              ? '/api/integrations/fedex'
              : type === 'ups'
                ? '/api/integrations/ups'
                : ''

      if (!testUrl) {
        toast.error('Test connection is not supported for this integration yet')
        return
      }

      const credentialsPayload =
        type === 'sellercloud'
          ? {
              domain: formData.domain,
              username: formData.username,
              password: formData.password,
            }
          : type === 'extensiv'
            ? {
                client_id: formData.client_id,
                client_secret: formData.client_secret,
                extensiv_id: formData.extensiv_id,
              }
            : type === 'fedex'
              ? {
                  account_number: formData.account_number,
                  client_id: formData.client_id,
                  client_secret: formData.client_secret,
                }
              : type === 'ups'
                ? {
                    account_number: formData.account_number,
                    client_id: formData.client_id,
                    client_secret: formData.client_secret,
                  }
                : {}

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_credentials',
          accountId,
          credentials: credentialsPayload,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result?.success) {
        setIsTestPassed(false)
        const genericFail =
          type === 'sellercloud'
            ? 'Sellercloud connection test failed'
            : type === 'extensiv'
              ? 'Extensiv connection test failed'
              : type === 'fedex'
                ? 'FedEx connection test failed'
                : 'UPS connection test failed'
        toast.error(result?.error || genericFail)
      } else {
        setIsTestPassed(true)
        const genericPass =
          type === 'sellercloud'
            ? 'Sellercloud connection test passed'
            : type === 'extensiv'
              ? 'Extensiv connection test passed'
              : type === 'fedex'
                ? 'FedEx connection test passed'
                : 'UPS connection test passed'
        toast.success(genericPass)
      }
    } catch {
      setIsTestPassed(false)
      const genericFail =
        type === 'sellercloud'
          ? 'Sellercloud connection test failed'
          : type === 'extensiv'
            ? 'Extensiv connection test failed'
            : type === 'fedex'
              ? 'FedEx connection test failed'
              : 'UPS connection test failed'
      toast.error(genericFail)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    const missingField = getMissingField()
    if (missingField) {
      toast.error(`${missingField.label} is required`)
      setLoading(false)
      return
    }

    if ((type === 'sellercloud' || type === 'extensiv' || type === 'fedex' || type === 'ups') && !isTestPassed) {
      toast.error(
        type === 'sellercloud'
          ? 'Please test Sellercloud connection before saving'
          : type === 'extensiv'
            ? 'Please test Extensiv connection before saving'
            : type === 'fedex'
              ? 'Please test FedEx connection before saving'
              : 'Please test UPS connection before saving',
      )
      setLoading(false)
      return
    }

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

    if (error) {
      toast.error('Error saving integration')
      setLoading(false)
      return
    }

    toast.success(type === 'sellercloud' ? 'Sellercloud integration saved' : 'Integration saved')
    handleClose()

    setLoading(false)
    handleSaved()
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

          {(type === 'sellercloud' || type === 'extensiv' || type === 'fedex' || type === 'ups') && (
            <button
              onClick={handleTest}
              disabled={testing || loading || isTestPassed}
              className="w-full mt-4 bg-[#3f2d90] text-white py-2 rounded-md text-sm hover:bg-[#3f2d90]/90 transition disabled:opacity-60"
            >
              {testing ? 'Testing...' : isTestPassed ? 'Test Connection Passed' : 'Test Connection'}
            </button>
          )}

          {((type !== 'sellercloud' && type !== 'extensiv' && type !== 'fedex' && type !== 'ups') || isTestPassed) && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-2 bg-black text-white py-2 rounded-md text-sm hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Integration'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
