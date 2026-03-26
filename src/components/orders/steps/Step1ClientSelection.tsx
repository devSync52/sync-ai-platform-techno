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
  initialClientUserId,
  onNext,
  onClientChange,
  onClientSaved,
}: {
  draftId: string
  initialClient: any
  initialClientUserId?: string | null
  onNext: () => void
  onClientChange?: (clientId: string | null) => void
  onClientSaved?: (clientAccountId: string, clientUserId?: string) => void
}) {
  const [allClients, setAllClients] = useState<ClientOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [draftClientAccountId, setDraftClientAccountId] = useState<string | null>(null)
  const [draftClientUserId, setDraftClientUserId] = useState<string | null>(null)
  const [draftShipToEmail, setDraftShipToEmail] = useState<string | null>(null)
  const [draftShipToName, setDraftShipToName] = useState<string | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [serviceFilter, setServiceFilter] = useState<string | null>(null)

  const currentService = () => {
    if (serviceFilter) return serviceFilter
    if (typeof window !== 'undefined') {
      const svc = new URLSearchParams(window.location.search).get('service')
      if (svc) return svc.toLowerCase()
    }
    return null
  }

  const getClientChangeValue = (client: ClientOption | undefined | null) => {
    if (!client) return null
    if ((currentService() || '').toLowerCase() === 'extensiv') {
      if (client.external_id) return `ext-${client.external_id}`
    }
    return client.account_id
  }

  useEffect(() => {
    const filtered = applyFilterAndSort(allClients, serviceFilter)
    setClients(filtered)
  }, [allClients, serviceFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const svc = params.get('service')
    if (svc) setServiceFilter(svc.toLowerCase())
  }, [])

  const applyFilterAndSort = (rows: ClientOption[], filter: string | null) => {
    const filtered =
      filter === 'extensiv'
        ? rows.filter((c) => (c.source || '').toLowerCase() === 'extensiv')
        : filter === 'sellercloud'
          ? rows.filter((c) => (c.source || '').toLowerCase() === 'sellercloud')
          : rows

    return filtered.sort((a, b) => {
      const srcA = (a.source || '').toLowerCase()
      const srcB = (b.source || '').toLowerCase()
      if (srcA === srcB) return 0
      if (srcA === 'extensiv') return -1
      if (srcB === 'extensiv') return 1
      return 0
    })
  }

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const svcParam = params.get('service')
        const url = svcParam ? `/api/customers?service=${encodeURIComponent(svcParam)}` : '/api/customers'

        const customersRes = await fetch(url, { credentials: 'include' })
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
              external_id: row?.external_id ?? row?.wms_user_identifier ?? null,
            }))
            .filter((row: ClientOption) => row.id.length > 0 && row.account_id.length > 0)
            .sort((a, b) => {
              const srcA = (a.source || '').toLowerCase()
              const srcB = (b.source || '').toLowerCase()
              if (srcA === srcB) return 0
              if (srcA === 'extensiv') return -1
              if (srcB === 'extensiv') return 1
              return 0
            })

          setAllClients(mapped)
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

        setAllClients(fallbackRows)
      } catch (err) {
        console.error('❌ Error loading clients via API:', err)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    const fetchInitialClient = async () => {
      if (initialClient || initialClientUserId) {
        setDraftClientAccountId(String(initialClient))
        if (initialClientUserId) setDraftClientUserId(String(initialClientUserId))
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
          if (json?.draft?.client_user_id) setDraftClientUserId(String(json.draft.client_user_id))
          const prefs = json?.draft?.preferences
          const preferred =
            typeof prefs === 'string'
              ? (() => {
                  try {
                    return JSON.parse(prefs)?.external_service
                  } catch {
                    return undefined
                  }
                })()
              : prefs?.external_service
          if (preferred) setServiceFilter(String(preferred).toLowerCase())
          const shipToRaw = json?.draft?.ship_to
          if (shipToRaw) {
            const shipToObj =
              typeof shipToRaw === 'string'
                ? (() => {
                    try {
                      return JSON.parse(shipToRaw)
                    } catch {
                      return {}
                    }
                  })()
                : shipToRaw
            setDraftShipToEmail(shipToObj?.email ? String(shipToObj.email) : null)
            setDraftShipToName(shipToObj?.full_name ? String(shipToObj.full_name) : null)
          }
        }
      } catch (err) {
        console.error('❌ Error loading draft via API:', err)
      }

      setIsLoadingDraft(false)
    }

    fetchInitialClient()
  }, [initialClient, draftId])

  useEffect(() => {
    if (isLoadingDraft || selectedClientId || clients.length === 0) return

    // Prefer exact user id match if available on draft.
    if (draftClientUserId) {
      const byUser = clients.find((c) => c.id === draftClientUserId)
      if (byUser) {
        setSelectedClientId(byUser.id)
        if (onClientChange) onClientChange(getClientChangeValue(byUser))
        return
      }
    }

    // Next, try to match by email from ship_to
    if (draftShipToEmail) {
      const byEmail = clients.find(
        (c) => String(c.email || '').toLowerCase() === String(draftShipToEmail || '').toLowerCase()
      )
      if (byEmail) {
        setSelectedClientId(byEmail.id)
        if (onClientChange) onClientChange(getClientChangeValue(byEmail))
        return
      }
    }

    // Next, try to match by name from ship_to
    if (draftShipToName) {
      const byName = clients.find(
        (c) => String(c.name || '').toLowerCase() === String(draftShipToName || '').toLowerCase()
      )
      if (byName) {
        setSelectedClientId(byName.id)
        if (onClientChange) onClientChange(getClientChangeValue(byName))
        return
      }
    }

    if (!draftClientAccountId) return

    const match =
      clients.find((c) => c.id === draftClientAccountId) ??
      clients.find((c) => c.account_id === draftClientAccountId)
    if (!match) return

    setSelectedClientId(match.id)
    if (onClientChange) onClientChange(getClientChangeValue(match))
  }, [isLoadingDraft, selectedClientId, draftClientAccountId, clients, onClientChange])

  useEffect(() => {
    if (!isLoadingDraft && !selectedClientId && clients.length === 1) {
      const onlyClient = clients[0]
      setSelectedClientId(onlyClient.id)
      if (onClientChange) onClientChange(getClientChangeValue(onlyClient))
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
                onClientChange(getClientChangeValue(selected))
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
                  {client.source ? ` • ${client.source}` : ''}
                  {client.external_id ? ` • ${client.external_id}` : ''}
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
              const service = (currentService() || '').toLowerCase()

              // Try to prefill contact data for Step 3 with the customer's name/email.
              let nextShipTo: any = null
              let draftPrefs: any = {}
              try {
                const draftRes = await fetch(`/api/quotes/drafts/${draftId}`, {
                  credentials: 'include',
                })
                const draftJson = await draftRes.json().catch(() => ({}))
                const rawShipTo = draftJson?.draft?.ship_to
                const shipToObj =
                  rawShipTo && typeof rawShipTo === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(rawShipTo)
                        } catch {
                          return {}
                        }
                      })()
                    : rawShipTo || {}

                const rawPrefs = draftJson?.draft?.preferences
                draftPrefs =
                  rawPrefs && typeof rawPrefs === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(rawPrefs)
                        } catch {
                          return {}
                        }
                      })()
                    : rawPrefs || {}

                nextShipTo = {
                  ...shipToObj,
                  full_name: shipToObj?.full_name || selected?.name || '',
                  email: shipToObj?.email || selected?.email || '',
                }
              } catch (err) {
                console.warn('⚠️ Could not prefill ship_to from draft:', err)
              }

              const patchPayload: any = {
                client: clientAccountId,
                client_user_id: selected?.id ?? selectedClientId,
                ...(nextShipTo ? { ship_to: nextShipTo } : {}),
              }

              if (service === 'extensiv' && selected?.external_id) {
                patchPayload.preferences = {
                  ...draftPrefs,
                  extensiv_customer_id: selected.external_id,
                }
              }

              const res = await fetch(`/api/quotes/drafts/${draftId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(patchPayload),
              })

              const json = await res.json()

              if (!res.ok) {
                console.error('❌ Error updating draft via API:', json)
                toast.error('Error saving customer selection')
                return
              }

              toast.success('Customer selected successfully')
              if (onClientChange) onClientChange(getClientChangeValue(selected))
              if (onClientSaved) onClientSaved(clientAccountId, selected?.id ?? selectedClientId)
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
