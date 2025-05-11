'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function sendStaffInviteAction({
  email,
  role,
  accountId,
  invitedBy,
}: {
  email: string
  role: string
  accountId: string
  invitedBy: string
}) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log('[sendStaffInviteAction] Dados recebidos:', {
      email,
      role,
      accountId,
      invitedBy,
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_staff_invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email,
        role,
        accountId,
        invitedBy,
      }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to invite user')

    return { success: true, userId: result.user_id }
  } catch (err: any) {
    console.error('[sendStaffInviteAction] Erro:', err)
    return { success: false, message: err.message }
  }
}
