'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import IntegrationCard from '@/components/integrationCards/integrationCard'
import IntegrationModal from '@/components/integrationCards/IntegrationModal'
import { IntegrationType } from '@/components/integrationCards/integrationFields'

interface IntegrationData {
  type: IntegrationType
  status: string | null
  last_synced_at: string | null
  credentials?: string
}

const availableIntegrations: { name: string; type: IntegrationType }[] = [
  { name: 'Sellercloud', type: 'sellercloud' },
  { name: 'Extensiv (3PL)', type: 'extensiv' },
  { name: 'Project44', type: 'project44' }
]

export default function IntegrationsPage() {
  const user = useCurrentUser()
  const supabase = useSupabaseClient()
  const [integrations, setIntegrations] = useState<Record<string, IntegrationData>>({})
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<IntegrationType | null>(null)
  const [modalData, setModalData] = useState<IntegrationData | null>(null)

  const fetchIntegrations = useCallback(async () => {
    if (!user?.account_id) return

    setLoading(true)
    const { data } = await supabase
      .from('account_integrations')
      .select('type, status, last_synced_at, credentials')
      .eq('account_id', user.account_id)

    const map: Record<string, IntegrationData> = {}
    data?.forEach((item) => {
      map[item.type] = item
    })

    setIntegrations(map)
    setLoading(false)
  }, [supabase, user?.account_id])

  useEffect(() => {
    if (user?.account_id) {
      fetchIntegrations()
    }
  }, [user?.account_id, fetchIntegrations])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Integrations</h1>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading integrations...</div>
      ) : (
        <div className="flex flex-col gap-6">
          {availableIntegrations.map(({ name, type }) => {
            const data = integrations[type]
            return (
              <IntegrationCard
                key={type}
                title={name}
                type={type}
                status={data?.status || null}
                lastSynced={data?.last_synced_at || null}
                accountId={user.account_id}
                onClick={() => {
                  setModalType(type)
                  setModalData(data || null)
                  setModalOpen(true)
                }}
                onTested={fetchIntegrations}
              />
            )
          })}
        </div>
      )}

      {modalType && user?.account_id && (
        <IntegrationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          accountId={user.account_id}
          type={modalType}
          existingData={modalData || undefined}
          onSaved={fetchIntegrations}
        />
      )}
    </div>
  )
}