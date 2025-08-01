'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Database } from '@/types/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type Account = Database['public']['Tables']['accounts']['Row']

export function QuoteClientSelectionSection({ onClientChange }: { onClientChange?: (client: Account) => void }) {
  const supabase = useSupabase()
  const currentUser = useCurrentUser()
  const [clients, setClients] = useState<Account[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      if (!currentUser?.account_id) return

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('parent_account_id', currentUser.account_id)
        .not('external_id', 'is', null)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Error loading clients:', error)
      } else {
        setClients(data || [])
      }
    }

    const fetchDraft = async () => {
      if (!currentUser?.account_id) return

      const { data, error } = await supabase
        .from('saip_quote_drafts')
        .select('client')
        .eq('account_id', currentUser.account_id)
        .eq('created_by_user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const client = data?.client as Account | undefined

      if (client?.id) {
        setSelectedClientId(client.id)
        if (onClientChange) {
          onClientChange(client)
        }
      }

      setIsLoadingDraft(false)
    }

    fetchClients()
    fetchDraft()
  }, [supabase, currentUser?.account_id])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>Client</Label>
        {!isLoadingDraft && (
          <Select value={selectedClientId} onValueChange={(clientId) => {
            setSelectedClientId(clientId)
            const selectedClient = clients.find((c) => c.id === clientId)
            if (selectedClient && onClientChange) {
              onClientChange(selectedClient)
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
      </CardContent>
    </Card>
  )
}