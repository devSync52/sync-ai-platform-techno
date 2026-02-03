'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function importProductsByChannelAction(channelId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { success: false, message: 'Not authenticated' }
  }

  // 🔎 Buscar dados do canal (precisa ter account_id e external_id)
  const { data: channel, error } = await supabase
    .from('channels')
    .select('account_id, external_id')
    .eq('id', channelId)
    .maybeSingle()

  if (error) {
    console.error('[importProductsByChannelAction] 🔥 Channel fetch error:', error.message)
    return { success: false, message: 'Failed to fetch channel info' }
  }

  if (!channel?.account_id || !channel?.external_id) {
    return { success: false, message: 'Missing account ID or Company ID (external_id)' }
  }

  // 🌐 URL da Edge Function
  const baseUrl = 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1'

  try {
    const response = await fetch(`${baseUrl}/import_sellercloud_products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // opcional: se quiser passar auth, incluir aqui
      },
      body: JSON.stringify({
        account_id: channel.account_id,
        channel_id: channelId,
        company_id: channel.external_id
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[importProductsByChannelAction] ❌ Edge error:', result)
      return { success: false, message: result?.message || 'Edge function failed' }
    }

    revalidatePath('/products')
    return { success: true, ...result }
  } catch (err) {
    console.error('[importProductsByChannelAction] ❌ Error calling edge function:', err)
    return {
      success: false,
      message: 'Failed to import products (network or server error)'
    }
  }
}