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
  console.log("🔎 Step1 - CURRENT USER:", JSON.stringify(currentUser, null, 2))
  const [clients, setClients] = useState<Account[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      if (!currentUser?.account_id || !currentUser?.role) return;

      // Se for client ou staff-client, define a própria account como client
      if (currentUser.role === 'client' || currentUser.role === 'staff-client') {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', currentUser.account_id)
          .single();

        if (error) {
          console.error('❌ Error loading self client (client/staff-client role):', error);
        } else if (data) {
          setClients([data]);
        }
      } else {
        // Admins veem os filhos normalmente
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('parent_account_id', currentUser.account_id)
          .not('external_id', 'is', null)
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Error loading clients:', error);
        } else {
          setClients(data || []);
        }
      }
    };

    fetchClients()
  }, [supabase, currentUser?.account_id, currentUser?.role])

  useEffect(() => {
    const fetchInitialClient = async () => {
      if (initialClient) {
        const clientId = initialClient as string
        setSelectedClientId(clientId)
        setIsLoadingDraft(false)
      } else if (draftId) {
        const { data, error } = await supabase
          .from('saip_quote_drafts')
          .select('client')
          .eq('id', draftId)
          .single()

        if (error) {
          console.error('❌ Error loading draft client:', error)
        } else if (data?.client) {
          setSelectedClientId(data.client)
        }
        setIsLoadingDraft(false)
      }
    }

    fetchInitialClient()
  }, [initialClient, draftId])

  useEffect(() => {
    // Auto-select client when there is only one option and no selection yet
    if (!isLoadingDraft && !selectedClientId && clients.length === 1) {
      const onlyClient = clients[0]
      setSelectedClientId(onlyClient.id)
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
                const { error } = await supabase
                  .from('saip_quote_drafts')
                  .update({ client: selectedClientId })
                  .eq('id', draftId)

                if (error) {
                  console.error('❌ Error updating draft:', error)
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