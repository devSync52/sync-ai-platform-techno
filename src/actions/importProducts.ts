'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function importProductsByAccountAction(accountId: string) {
  const supabase = createServerActionClient({ cookies })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.user) return { success: false, message: 'Not authenticated' }

  const res = await fetch(`${process.env.NEXT_PUBLIC_FUNCTIONS_URL}/import_sellercloud_products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_id: accountId })
  })

  const result = await res.json()
  revalidatePath('/products')
  return result
}