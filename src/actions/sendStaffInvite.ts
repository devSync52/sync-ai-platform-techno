'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function sendStaffInviteAction({ email }: { email: string }) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://app.syncaiplatform.com/reset-password',
  })

  if (error) {
    console.error('[sendStaffInviteAction] Supabase error:', error.message)
    return { success: false, message: error.message }
  }

  return { success: true }
}