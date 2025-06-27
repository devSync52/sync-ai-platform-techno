import IntegrationTypeLogo from './IntegrationTypeLogo'
import IntegrationStatusBadge from './IntegrationStatusBadge'
import { IntegrationType } from './integrationFields'
import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
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
  const supabase = useSupabase()
  const [testing, setTesting] = useState(false)

  const handleTestConnection = async () => {
    if (!accountId) return
    setTesting(true)

    const toastId = toast.loading(`Testing ${title} connection...`)

    const functionMap: Record<string, string> = {
      sellercloud: 'test_integration',
      extensiv: 'test_integration_extensiv',
      project44: 'test_integration_project44'
    }

    const functionName = functionMap[type]
    if (!functionName) {
      toast.error(`Unknown integration type: ${type}`, { id: toastId })
      setTesting(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId })
      })

      const result = await response.json()
      setTesting(false)

      if (response.ok && result.success) {
        toast.success(`✅ ${title} is connected!`, { id: toastId })
      } else {
        toast.error(`❌ ${title} failed to connect`, { id: toastId })
      }
    } catch (err) {
      console.error(`❌ Error testing ${type} connection:`, err)
      toast.error(`Error testing ${title}`, { id: toastId })
      setTesting(false)
    }

    onTested?.()
  }

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white w-[320px]">
      <div className="flex items-center justify-between gap-4 flex-col">
        <div className="w-[150px] flex-shrink-0 flex justify-center">
          <IntegrationTypeLogo type={type} size={150} />
        </div>

        <div className="flex-1 min-w-[120px] text-center">
          <h2 className="text-2xl font-medium">{title}</h2>
        </div>

        <div className="text-center">
          <IntegrationStatusBadge status={status || 'inactive'} />
        </div>

        <div className="text-sm text-gray-500 min-w-[180px] text-center">
          {lastSynced ? new Date(lastSynced).toLocaleString() : '—'}
        </div>

        <div className="flex gap-4 text-center">
          <button
            onClick={onClick}
            className="text-white px-4 py-2 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition"
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

        <div className="text-center">Select:</div>
      </div>
    </div>
  )
}