'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'

type Account = Database['public']['Tables']['accounts']['Row']

type ClientOption = {
  id: string
  account_id: string
  name: string
  email?: string | null
  source?: string | null
  external_id?: string | null
}

export function Step1ClientSelection({
  draftId,
  initialClient,
  onNext,
  onClientChange,
}: {
  draftId: string
  initialClient: any
  onNext: () => void
  onClientChange?: (clientId: string | null) => void
}) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [draftClientAccountId, setDraftClientAccountId] = useState<string | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const customersRes = await fetch('/api/customers', { credentials: 'include' })
        const customersJson = await customersRes.json()

        if (customersRes.ok) {
          const customerRows = Array.isArray(customersJson?.customers) ? customersJson.customers : []
          const mapped: ClientOption[] = customerRows
            .map((row: any) => ({
              id: String(row?.id || ''),
              account_id: String(row?.account_id || ''),
              name: String(row?.name || 'Unnamed'),
              email: row?.email ?? null,
              source: row?.source ?? row?.origin ?? null,
              external_id: row?.wms_user_identifier ?? null,
            }))
            .filter((row: ClientOption) => row.id.length > 0 && row.account_id.length > 0)

          setClients(mapped)
          return
        }

        // Fallback for roles that cannot read /api/customers.
        const res = await fetch('/api/accounts/clients', { credentials: 'include' })
        const json = await res.json()

        if (!res.ok) {
          console.error('❌ Error loading clients via API:', json)
          return
        }

        const fallbackRows: ClientOption[] = (json?.clients ?? []).map((client: Account) => ({
          id: String(client.id),
          account_id: String(client.id),
          name: String(client.name || 'Unnamed'),
          email: null,
          source: client.source ?? null,
          external_id: client.external_id ?? null,
        }))

        setClients(fallbackRows)
      } catch (err) {
        console.error('❌ Error loading clients via API:', err)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    const fetchInitialClient = async () => {
      if (initialClient) {
        setDraftClientAccountId(String(initialClient))
        setIsLoadingDraft(false)
        return
      }

      if (!draftId) {
        setIsLoadingDraft(false)
        return
      }

      try {
        const res = await fetch(`/api/quotes/drafts/${draftId}`, {
          credentials: 'include',
        })
        const json = await res.json()

        if (!res.ok) {
          console.error('❌ Error loading draft via API:', json)
        } else if (json?.draft?.client) {
          setDraftClientAccountId(String(json.draft.client))
        }
      } catch (err) {
        console.error('❌ Error loading draft via API:', err)
      }

      setIsLoadingDraft(false)
    }

    fetchInitialClient()
  }, [initialClient, draftId])

  useEffect(() => {
    if (isLoadingDraft || selectedClientId || !draftClientAccountId || clients.length === 0) return

    const match = clients.find((c) => c.account_id === draftClientAccountId)
    if (!match) return

    setSelectedClientId(match.id)
    if (onClientChange) onClientChange(match.account_id)
  }, [isLoadingDraft, selectedClientId, draftClientAccountId, clients, onClientChange])

  useEffect(() => {
    if (!isLoadingDraft && !selectedClientId && clients.length === 1) {
      const onlyClient = clients[0]
      setSelectedClientId(onlyClient.id)
      if (onClientChange) onClientChange(onlyClient.account_id)
    }
  }, [isLoadingDraft, selectedClientId, clients, onClientChange])

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Select Customer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>Customer</Label>
        {!isLoadingDraft && (
          <Select
            value={selectedClientId}
            onValueChange={(clientId) => {
              setSelectedClientId(clientId)
              const selected = clients.find((c) => c.id === clientId)
              if (selected && onClientChange) {
                onClientChange(selected.account_id)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name || 'Unnamed'}
                  {client.email ? ` • ${client.email}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="pt-4 flex justify-end">
          <button
            onClick={async () => {
              if (!selectedClientId) {
                toast.error('Customer required', {
                  description: 'Please select a customer before proceeding.',
                })
                return
              }

              const selected = clients.find((c) => c.id === selectedClientId)
              const clientAccountId = selected?.account_id || selectedClientId

              const res = await fetch(`/api/quotes/drafts/${draftId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ client: clientAccountId }),
              })

              const json = await res.json()

              if (!res.ok) {
                console.error('❌ Error updating draft via API:', json)
                toast.error('Error saving customer selection')
                return
              }

              toast.success('Customer selected successfully')
              if (onClientChange) onClientChange(clientAccountId)
              onNext()
            }}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
