'use server'

import { createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

interface SendInviteParams {
  channelId: string
  email: string
}

export async function sendInviteAction({ channelId, email }: SendInviteParams) {
  try {
    const supabase = await createServerClient()
    const token = uuidv4()

    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          channel_id: channelId,
          email: email,
          token: token,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error inserting invitation:', error)
      return { success: false, message: 'Error sending invite.' }
    }

    // Opcional: revalidar cache da página se precisar
    revalidatePath('/channels')

    return { success: true, message: 'Invite sent successfully!', invitation: data }
  } catch (err) {
    console.error('Unexpected error in sendInviteAction:', err)
    return { success: false, message: 'Unexpected server error.' }
  }
}