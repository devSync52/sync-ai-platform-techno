'use server'

import { createClient } from '@/utils/supabase/server'

type Params = {
  email: string
  role: string
  accountId: string
  invitedBy: string
}

export async function sendStaffInviteAction({
  email,
  role,
  accountId,
  invitedBy,
}: Params): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient()

  try {
    // Faça a chamada para sua Edge Function (exemplo com fetch)
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_staff_invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role, accountId, invitedBy }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return { success: false, message: `HTTP ${response.status} - ${errorBody}` }
    }

    const result = await response.json()

    return { success: true, message: result.message }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}