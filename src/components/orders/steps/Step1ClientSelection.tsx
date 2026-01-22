'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type Account = Database['public']['Tables']['accounts']['Row']

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
  const supabase = useSupabase()
  const currentUser = useCurrentUser()
  const [clients, setClients] = useState<Account[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/accounts/clients', { credentials: 'include' })
        const json = await res.json()

        if (!res.ok) {
          console.error('❌ Error loading clients via API:', json)
          return
        }

        setClients((json?.clients ?? []) as Account[])
      } catch (err) {
        console.error('❌ Error loading clients via API:', err)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    const fetchInitialClient = async () => {
      if (initialClient) {
        const clientId = initialClient as string
        setSelectedClientId(clientId)
        if (onClientChange) {
          onClientChange(clientId)
        }
        setIsLoadingDraft(false)
      } else if (draftId) {
        try {
          const res = await fetch(`/api/quotes/drafts/${draftId}`, {
            credentials: 'include',
          })
          const json = await res.json()

          if (!res.ok) {
            console.error('❌ Error loading draft via API:', json)
          } else if (json?.draft?.client) {
            setSelectedClientId(json.draft.client)
            if (onClientChange) {
              onClientChange(json.draft.client)
            }
          }
        } catch (err) {
          console.error('❌ Error loading draft via API:', err)
        }
        setIsLoadingDraft(false)
      }
    }

    fetchInitialClient()
  }, [initialClient, draftId, onClientChange])

  useEffect(() => {
    // Auto-select client when there is only one option and no selection yet
    if (!isLoadingDraft && !selectedClientId && clients.length === 1) {
      const onlyClient = clients[0]
      setSelectedClientId(onlyClient.id)
      if (onClientChange) {
        onClientChange(onlyClient.id)
      }
    }
  }, [isLoadingDraft, selectedClientId, clients, onClientChange])

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Select Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>Client</Label>
        {!isLoadingDraft && (
          <Select value={selectedClientId} onValueChange={(clientId) => {
            setSelectedClientId(clientId)
            if (onClientChange) {
              onClientChange(clientId)
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name || 'Unnamed'} - {client.source} - {client.external_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="pt-4 flex justify-end">
          <button
            onClick={async () => {
              if (selectedClientId) {
                const res = await fetch(`/api/quotes/drafts/${draftId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ client: selectedClientId }),
                })

                const json = await res.json()

                if (!res.ok) {
                  console.error('❌ Error updating draft via API:', json)
                  toast.error('Error saving client selection')
                  return
                }

                toast.success('Client selected successfully')
                if (onClientChange) onClientChange(selectedClientId)
                onNext()
              } else {
                toast.error('Client required', {
                  description: 'Please select a client before proceeding.',
                })
              }
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