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

  const { data: channel, error } = await supabase
    .from('channels')
    .select('account_id, external_id')
    .eq('id', channelId)
    .maybeSingle()

  if (error || !channel?.account_id || !channel?.external_id) {
    return { success: false, message: 'Missing channel or CompanyID' }
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_FUNCTIONS_URL}/import_sellercloud_products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: channel.account_id,
      channel_id: channelId,
      company_id: channel.external_id
    })
  })

  const result = await response.json()
  revalidatePath('/products')
  return result
}