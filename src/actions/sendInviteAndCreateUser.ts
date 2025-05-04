'use server'

import { createServerClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

interface SendInviteAndCreateUserParams {
  channelId: string
  email: string
}

export async function sendInviteAndCreateUserAction({ channelId, email }: SendInviteAndCreateUserParams) {
  try {
    const supabase = await createServerClient()
    const token = uuidv4()

    // Primeiro, cria o convite
    const { data: invitation, error: invitationError } = await supabase
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

    if (invitationError) {
      console.error('Error inserting invitation:', invitationError)
      return { success: false, message: 'Error sending invite.' }
    }

    // Depois, cria o usuário no auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: false, // Não exige confirmação agora
      user_metadata: {
        invited_by: 'admin', // Ou depois podemos colocar o id do admin
        channel_id: channelId,
      },
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return { success: false, message: 'Error creating user.' }
    }

    // Opcional: revalidar cache da página
    revalidatePath('/channels')

    return {
      success: true,
      message: 'Invite and user created successfully!',
      invitation,
      user: userData.user,
    }
  } catch (err) {
    console.error('Unexpected error in sendInviteAndCreateUserAction:', err)
    return { success: false, message: 'Unexpected server error.' }
  }
}