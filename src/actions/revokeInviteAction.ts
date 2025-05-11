'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function revokeInviteAction({
  email
}: {
  email: string
}) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log('[revokeInviteAction] Revogando convite de:', email)

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/revoke_staff_invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to revoke invite')

    return { success: true }
  } catch (err: any) {
    console.error('[revokeInviteAction] Erro:', err)
    return { success: false, message: err.message }
  }
}