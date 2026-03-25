'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import IntegrationCard from '@/components/integrationCards/integrationCard'
import IntegrationModal from '@/components/integrationCards/IntegrationModal'
import { IntegrationType } from '@/components/integrationCards/integrationFields'
import { toast } from 'sonner'

interface IntegrationData {
  type: IntegrationType
  status: string | null
  last_synced_at: string | null
  credentials?: string
  metadata?: Record<string, unknown> | null
  isDefault?: boolean
}

const availableIntegrations: { name: string; type: IntegrationType }[] = [
  { name: 'Sellercloud', type: 'sellercloud' },
  { name: 'Extensiv (3PL)', type: 'extensiv' },
  { name: 'Magaya', type: 'magaya' },
  { name: 'UPS', type: 'ups' },
  { name: 'FedEx', type: 'fedex' },
  { name: 'QuickBooks', type: 'quickbooks' }
]

export default function IntegrationsPage() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [integrations, setIntegrations] = useState<Record<string, IntegrationData>>({})
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<IntegrationType | null>(null)
  const [modalData, setModalData] = useState<IntegrationData | null>(null)

  const fetchIntegrations = useCallback(async () => {
    if (!user?.account_id) return

    setLoading(true)
    const { data, error } = await supabase
      .from('account_integrations')
      .select('type, status, last_synced_at, credentials, metadata')
      .eq('account_id', user.account_id)

    if (error) {
      console.error('Error loading integrations:', error.message)
      setLoading(false)
      return
    }

    const map: Record<string, IntegrationData> = {}
    data?.forEach((item) => {
      const metadata = (item as { metadata?: Record<string, unknown> | null })?.metadata || null
      map[item.type] = {
        ...item,
        metadata,
        isDefault: Boolean((metadata as Record<string, unknown> | null)?.['is_default'])
      }
    })

    setIntegrations(map)
    setLoading(false)
  }, [supabase, user?.account_id])

  useEffect(() => {
    if (user?.account_id) {
      fetchIntegrations()
    }
  }, [user?.account_id, fetchIntegrations])

  const handleSetDefault = useCallback(
    async (type: IntegrationType) => {
      if (!user?.account_id) return

      const toastId = toast.loading('Updating default integration...')

      try {
        for (const [integrationType, data] of Object.entries(integrations)) {
          const existingMetadata = (data?.metadata as Record<string, unknown> | null) || {}
          const metadataWithoutFlag = { ...existingMetadata }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete metadataWithoutFlag.is_default

          const { error } = await supabase
            .from('account_integrations')
            .update({
              metadata: {
                ...metadataWithoutFlag,
                is_default: integrationType === type
              }
            })
            .eq('account_id', user.account_id)
            .eq('type', integrationType)

          if (error) {
            throw error
          }
        }

        toast.success('Default integration updated', { id: toastId })
        await fetchIntegrations()
      } catch (error) {
        console.error('Error setting default integration:', error)
        toast.error('Failed to update default', { id: toastId })
      }
    },
    [integrations, supabase, user?.account_id, fetchIntegrations]
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
          Integrations
        </h1>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading integrations...</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {availableIntegrations.map(({ name, type }) => {
            const data = integrations[type]
            return (
              <IntegrationCard
                key={type}
                title={name}
                type={type}
                status={data?.status || null}
                lastSynced={data?.last_synced_at || null}
                accountId={user?.account_id || ''}
                onClick={() => {
                  setModalType(type)
                  setModalData(data || null)
                  setModalOpen(true)
                }}
                onTested={fetchIntegrations}
                isDefault={Boolean(data?.isDefault)}
                onSetDefault={() => handleSetDefault(type)}
              />
            )
          })}
        </div>
      )}

      {modalType && user?.account_id && (
        <IntegrationModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        accountId={user.account_id!}
        type={modalType}
        existingData={modalData || undefined}
        handleSaved={fetchIntegrations}
      />
      )}
    </div>
  )
}
