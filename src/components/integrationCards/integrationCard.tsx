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
  isDefault?: boolean
  onSetDefault?: () => Promise<void> | void
}

export default function IntegrationCard({
  type,
  status,
  lastSynced,
  onClick,
  title,
  accountId,
  onTested,
  isDefault = false,
  onSetDefault
}: Props) {
  const supabase = useSupabase()
  const [testing, setTesting] = useState(false)
  const [settingDefault, setSettingDefault] = useState(false)

  const runSellercloudAction = async (action: 'disconnect') => {
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

  const handleMarkDefault = async () => {
    if (!accountId || !onSetDefault || status !== 'active') return
    setSettingDefault(true)
    try {
      await onSetDefault()
    } finally {
      setSettingDefault(false)
    }
  }

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white w-[320px]">
      <div className="flex items-center justify-between gap-4 flex-col">
        <div className="w-[150px] flex-shrink-0 flex justify-center">
          <IntegrationTypeLogo type={type} size={150} />
        </div>

        <div className="flex-1 min-w-[120px] text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-medium">{title}</h2>
            {isDefault && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Default
              </span>
            )}
          </div>
        </div>

        <div className="text-center">
          <IntegrationStatusBadge status={status || 'inactive'} />
        </div>

        <div className="text-sm text-gray-500 min-w-[180px] text-center">
          {lastSynced ? new Date(lastSynced).toLocaleString() : '—'}
        </div>

        <div className="flex gap-3 text-center flex-wrap justify-center">
          <button
            onClick={onClick}
            className="text-white px-4 py-2 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition"
          >
            {status ? 'Configure' : 'Connect'}
          </button>

          {status === 'active' && (
            <button
              onClick={async () => {
                if (!accountId) return

                setTesting(true)
                const toastId = toast.loading(`Disconnecting ${title}...`)

                if (type === 'sellercloud') {
                  try {
                    const { ok, result } = await runSellercloudAction('disconnect')

                    if (ok) {
                      toast.success(`🔌 ${title} disconnected`, { id: toastId })
                      onTested?.()
                    } else {
                      toast.error(result?.error || `❌ Failed to disconnect ${title}`, { id: toastId })
                    }
                  } catch (err) {
                    console.error(`[${type}] disconnect error:`, err)
                    toast.error(`❌ Failed to disconnect ${title}`, { id: toastId })
                  } finally {
                    setTesting(false)
                  }
                  return
                }

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
                setTesting(false)
              }}
              disabled={!accountId || testing}
              className="text-white px-4 py-2 rounded-md text-sm bg-[#3f2d90] hover:bg-[#3f2d90]/90 transition"
            >
              {testing ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}

          <button
            onClick={handleMarkDefault}
            disabled={!accountId || status !== 'active' || isDefault || testing || settingDefault}
            className="px-4 py-2 rounded-md text-sm border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDefault ? 'Default' : settingDefault ? 'Saving...' : 'Set default'}
          </button>
        </div>


      </div>
    </div>
  )
}
