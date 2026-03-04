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

  const runSellercloudAction = async (action: 'connect' | 'disconnect' | 'retry' | 'test') => {
    const response = await fetch('/api/integrations/sellercloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        accountId,
      }),
    })

    const result = await response.json().catch(() => ({}))
    return { ok: response.ok && Boolean(result?.success), result }
  }

  const handleTestConnection = async () => {
    if (!accountId) return
    setTesting(true)

    const toastId = toast.loading(`Testing ${title} connection...`)

    if (type === 'sellercloud') {
      try {
        const { ok, result } = await runSellercloudAction('test')

        if (ok) {
          toast.success(`✅ ${title} is connected!`, { id: toastId })
        } else {
          toast.error(result?.error || `❌ ${title} failed to connect`, { id: toastId })
        }
      } catch (err) {
        console.error(`❌ Error testing ${type} connection:`, err)
        toast.error(`Error testing ${title}`, { id: toastId })
      }

      setTesting(false)
      onTested?.()
      return
    }

    const functionMap: Record<string, string> = {
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
        body: JSON.stringify({
          account_id: accountId,
          type: type
        })
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
            onClick={async () => {
              if (!accountId) return

              const toastId = toast.loading(`${status === 'active' ? 'Disconnecting' : 'Connecting'} ${title}...`)

              if (type === 'sellercloud') {
                try {
                  const action = status === 'active' ? 'disconnect' : 'connect'
                  const { ok, result } = await runSellercloudAction(action)

                  if (ok) {
                    toast.success(
                      status === 'active' ? `🔌 ${title} disconnected` : `✅ ${title} connected`,
                      { id: toastId }
                    )
                    onTested?.()
                  } else {
                    toast.error(result?.error || `❌ Failed to ${action} ${title}`, { id: toastId })
                  }
                } catch (err) {
                  console.error(`[${type}] action error:`, err)
                  toast.error(`❌ Failed to update ${title}`, { id: toastId })
                }
                return
              }

              if (status === 'active') {
                const { error } = await supabase
                  .from('account_integrations')
                  .update({ status: 'inactive' })
                  .eq('account_id', accountId)
                  .eq('type', type)

                if (error) {
                  console.error('[disconnect] error:', error)
                  toast.error(`❌ Failed to disconnect ${title}`, { id: toastId })
                } else {
                  toast.success(`🔌 ${title} disconnected`, { id: toastId })
                  onTested?.()
                }
              } else {
                await handleTestConnection()
              }
            }}
            disabled={!accountId || testing}
            className="text-white px-4 py-2 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition"
          >
            {status === 'active'
              ? testing
                ? 'Disconnecting...'
                : 'Disconnect'
              : testing
                ? 'Connecting...'
                : 'Connect'}
          </button>
        </div>

        
      </div>
    </div>
  )
}
