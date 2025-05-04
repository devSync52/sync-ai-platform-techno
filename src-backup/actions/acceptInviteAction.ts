'use server'

import { createAdminClient } from '@/utils/supabase/admin'

interface AcceptInviteParams {
  token: string
  password: string
}

export async function acceptInviteAction({ token, password }: AcceptInviteParams) {
  try {
    const supabase = createAdminClient()

    // 1. Buscar convite pendente
    console.log('➡️ Step 1: Checking token...', token)
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      console.error('❌ Error finding invitation:', inviteError)
      return { success: false, message: 'Invalid or expired invitation.' }
    }

    console.log('✅ Step 2: Invitation found:', invitation)

    // 2. Buscar dados do channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', invitation.channel_id)
      .single()

    if (channelError || !channel) {
      console.error('❌ Error fetching channel:', channelError)
      return { success: false, message: 'Channel not found.' }
    }

    console.log('✅ Step 3: Channel found:', channel)

    // 3. Verificar se já existe user
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .maybeSingle()

    let userId: string | null = null

    if (userExists) {
      console.log('⚡ User already exists in public.users')
      userId = userExists.id
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
      })

      if (authError || !authData?.user) {
        console.error('❌ Auth error creating user:', authError)
        return { success: false, message: 'Error creating user account.' }
      }

      userId = authData.user.id
      console.log('✅ Step 4: Auth user created:', userId)
    }

    if (!userId) {
      return { success: false, message: 'Failed to determine user ID.' }
    }

    // 4. Criar account do cliente com base nos dados do channel
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert([
        {
          name: channel.company_name || channel.email,
          email: channel.email || null,
          phone: channel.phone || null,
          address_line_1: channel.address_line1 || null,
          address_line_2: channel.address_line2 || null,
          city: channel.city || null,
          state: channel.state || null,
          zip_code: channel.zip_code || null,
          country: channel.country || 'US',
          parent_account_id: invitation.parent_account_id, // Herdado
          status: 'active',
        }
      ])
      .select()
      .single()

    if (accountError || !accountData) {
      console.error('❌ Error creating client account:', accountError)
      return { success: false, message: 'Error creating client account.' }
    }

    console.log('✅ Step 5: Client account created:', accountData.id)

    // 5. Inserir o user novo vinculado a essa account
    const { error: insertUserError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: invitation.email,
        account_id: accountData.id,
        role: 'client',
      })

    if (insertUserError) {
      console.error('❌ Error inserting into users:', insertUserError)
      return { success: false, message: 'Error inserting user record.' }
    }

    console.log('✅ Step 6: User inserted')

    // 6. Atualizar convite
    await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    console.log('🎉 Step 7: Invitation marked as accepted')

    return { success: true }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { success: false, message: 'Unexpected server error.' }
  }
}