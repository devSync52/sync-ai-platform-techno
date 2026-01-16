'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { QuotesList }  from '@/components/orders/OrderList'

export default function QuotesPage() {
  const router = useRouter()
  const  supabase  = useSupabase()
  const user = useCurrentUser()
  const [creating, setCreating] = useState(false)

  const handleCreateQuote = async () => {
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
        client: user.account_id,
        ship_from: step_data_2,
        order: true,
      })
      .select('id')
      .single()

    setCreating(false)

    if (data?.id) {
      router.push(`/orders/quotes/${data.id}`)
    } else {
      console.error('❌ Failed to create draft:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-right justify-between">
          
          <Button onClick={handleCreateQuote} disabled={creating}>
            {creating ? 'Creating...' : 'Create Order'}
          </Button>
        </CardHeader>
        <CardContent>
          <QuotesList />
        </CardContent>
      </Card>
    </div>
  )
}