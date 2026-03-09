'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { QuotesList }  from '@/components/orders/OrderList'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type ExternalService = 'sellercloud' | 'extensiv'

const SERVICE_LABELS: Record<ExternalService, string> = {
  sellercloud: 'Sellercloud',
  extensiv: 'Extensiv (3PL)',
}

export default function QuotesPage() {
  const router = useRouter()
  const  supabase  = useSupabase()
  const user = useCurrentUser()
  const [creating, setCreating] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [availableServices, setAvailableServices] = useState<ExternalService[]>([])
  const [selectedService, setSelectedService] = useState<ExternalService | null>(null)

  useEffect(() => {
    const fetchAvailableServices = async () => {
      if (!user?.account_id) return
      setLoadingServices(true)

      const { data, error } = await supabase
        .from('account_integrations')
        .select('type, status')
        .eq('account_id', user.account_id)
        .in('type', ['sellercloud', 'extensiv'])

      if (error) {
        console.error('❌ Failed to load integrations for order creation:', error)
        setAvailableServices([])
        setLoadingServices(false)
        return
      }

      const active = (data || [])
        .filter((row: any) => String(row?.status || '').toLowerCase() === 'active')
        .map((row: any) => String(row?.type || '').toLowerCase())
        .filter((type: string): type is ExternalService => type === 'sellercloud' || type === 'extensiv')

      setAvailableServices(active)
      setSelectedService(active[0] ?? null)
      setLoadingServices(false)
    }

    fetchAvailableServices()
  }, [supabase, user?.account_id])

  const handleCreateQuote = async (service: ExternalService) => {
    if (!user?.id || !user?.account_id || !user?.role) return
    setCreating(true)

    let step_data_1 = null
    let step_data_2 = null

    if (user.role === 'client' || user.role === 'staff-client') {
      // Buscar warehouse (parent account)
      const { data: accountData } = await supabase
        .from('accounts')
        .select('parent_account_id')
        .eq('id', user.account_id)
        .single()
    
      const parent_account_id = accountData?.parent_account_id
    
      if (!parent_account_id) {
        console.error('❌ parent_account_id not found on user.account')
        setCreating(false)
        return
      }
    
      const { data: parent, error: parentError } = await supabase
        .from('accounts')
        .select('id, name, email, phone, address_line1, address_line2, city, state, zip_code, country')
        .eq('id', parent_account_id)
        .single()
    
      if (parent) {
        step_data_1 = user.account_id
      }
    
      step_data_2 = {
        full_name: 'Miami Warehouse',
        email: null,
        phone: null,
        address_line1: '10201 NW 112th Ave Suite 1',
        address_line2: null,
        city: 'Medley',
        state: 'FL',
        zip_code: '33178',
        country: 'United States',
      }
    }

    const { data, error } = await supabase
      .from('saip_quote_drafts')
      .insert({
        user_id: user.id,
        account_id: user.account_id,
        step: 1,
        ship_from: step_data_2,
        preferences: {
          external_service: service,
        },
        order: true,
      })
      .select('id')
      .single()

    setCreating(false)

    if (data?.id) {
      setServiceDialogOpen(false)
      router.push(`/orders/create-order/${data.id}`)
    } else {
      console.error('❌ Failed to create draft:', error)
      toast.error('Failed to create order draft')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-right justify-between">
          <Button onClick={() => setServiceDialogOpen(true)} disabled={creating || loadingServices}>
            {creating ? 'Creating...' : 'Create Order'}
          </Button>
        </CardHeader>
        <CardContent>
          <QuotesList />
        </CardContent>
      </Card>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Select External Service</DialogTitle>
            <DialogDescription>
              Choose which connected OMS/WMS should receive this order.
            </DialogDescription>
          </DialogHeader>

          {loadingServices ? (
            <p className="text-sm text-muted-foreground">Loading integrations...</p>
          ) : availableServices.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No active external service found. Activate Sellercloud in Settings &gt; Integrations.
            </div>
          ) : (
            <div className="space-y-2">
              {availableServices.map((service) => {
                const active = selectedService === service
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={[
                      'w-full rounded-md border px-3 py-3 text-left text-sm transition',
                      active
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-gray-200 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <p className="font-medium">{SERVICE_LABELS[service]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {service === 'sellercloud'
                        ? 'Create order in Sellercloud after you complete the form.'
                        : 'Extensiv flow will be added next.'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedService) return
                if (selectedService !== 'sellercloud') {
                  toast.info('Only Sellercloud order creation is enabled for now.')
                  return
                }
                handleCreateQuote(selectedService)
              }}
              disabled={creating || !selectedService}
            >
              {creating ? 'Creating...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
