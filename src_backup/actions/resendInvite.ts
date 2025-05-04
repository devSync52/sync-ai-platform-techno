'use server'

import { createServerClient } from '@/utils/supabase/server'

interface ResendInviteParams {
  channelId: string
}

export async function resendInviteAction({ channelId }: ResendInviteParams) {
  try {
    const supabase = await createServerClient()

    // Buscar o convite existente para esse canal
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('email, token')
      .eq('channel_id', channelId)
      .single()

    if (error || !invitation) {
      console.error('Error fetching invitation for resend:', error)
      return { success: false, message: 'Invitation not found.' }
    }

    const { email, token } = invitation

    // Aqui no futuro você pode disparar um email real com Resend

    console.log(`🔄 Resending invite to ${email} with token ${token}`)

    return { success: true, message: 'Invite resent successfully!' }
  } catch (err) {
    console.error('Unexpected error resending invite:', err)
    return { success: false, message: 'Unexpected server error.' }
  }
}