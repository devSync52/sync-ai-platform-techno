import IntegrationTypeLogo from './IntegrationTypeLogo'
import IntegrationStatusBadge from './IntegrationStatusBadge'
import { IntegrationType } from './integrationFields'
import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'

interface Props {
  type: IntegrationType
  status: string | null
  lastSynced: string | null
  onClick: () => void
  title: string
  accountId?: string
  onTested?: () => void
}

export default function IntegrationCard({
  type,
  status,
  lastSynced,
  onClick,
  title,
  accountId,
  onTested
}: Props) {
  const supabase = useSupabaseClient()
  const [testing, setTesting] = useState(false)

  const handleTestConnection = async () => {
    if (!accountId) return
    setTesting(true)

    const toastId = toast.loading(`Testing ${title} connection...`)

    const response = await fetch(`${process.env.NEXT_PUBLIC_FUNCTIONS_URL}/test_integration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, type })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('⚠️ Raw response:', text)
      console.error('⚠️ Status code:', response.status)
      throw new Error('Erro na função')
    }
    
    const result = await response.json()
    setTesting(false)

    if (result.success) {
      toast.success(`✅ ${title} is connected!`, { id: toastId })
    } else {
      toast.error(`❌ ${title} failed to connect`, { id: toastId })
    }

    onTested?.()
  }

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Logo */}
        <div className="w-[48px] flex-shrink-0 flex justify-center">
          <IntegrationTypeLogo type={type} size={48} />
        </div>

        <div className="flex-1 min-w-[120px]">
          <h2 className="text-base font-medium">{title}</h2>
        </div>

        <div className="min-w-[100px]">
          <IntegrationStatusBadge status={status || 'inactive'} />
        </div>

        <div className="text-sm text-gray-500 min-w-[180px]">
          {lastSynced ? new Date(lastSynced).toLocaleString() : '—'}
        </div>

        <div className="min-w-[180px] flex gap-2">
          <button
            onClick={onClick}
            className=" text-white px-4 py-2 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition"
          >
            {status ? 'Configure' : 'Connect'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || !accountId}
            className="bg-gray-100 border text-sm px-3 py-2 rounded-md hover:bg-gray-200 transition"
          >
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
      </div>
    </div>
  )
}
