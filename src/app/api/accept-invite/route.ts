import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ error: 'Token missing.' }, { status: 400 })
  }

  // Buscar o convite
  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .select('id, email, channel_id, account_id, status')
    .eq('token', token)
    .single()

  if (invitationError || !invitation || invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid or expired invitation.' }, { status: 400 })
  }

  // Buscar dados do canal
  const { data: channel } = await supabase
    .from('channels')
    .select('company_name, contact_name, phone, city, state, zip_code')
    .eq('id', invitation.channel_id)
    .single()

  if (!channel) {
    return NextResponse.json({ error: 'Channel not found.' }, { status: 400 })
  }

  // 1. Criar nova account para o canal
  const { data: newAccount, error: accountError } = await supabase
    .from('accounts')
    .insert({
      name: channel.company_name || 'New Client',
      email: invitation.email,
      phone: channel.phone,
      city: channel.city,
      state: channel.state,
      zip_code: channel.zip_code,
      country: 'US',
      parent_account_id: invitation.account_id,
    })
    .select()
    .single()

  if (accountError || !newAccount) {
    return NextResponse.json({ error: 'Error creating account.' }, { status: 400 })
  }

  // 2. Criar o user no auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: invitation.email,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    return NextResponse.json({ error: 'Error creating auth user.' }, { status: 400 })
  }

  const authUserId = authUser.user.id

  // 3. Criar o user no public.users
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUserId,
      name: channel.contact_name || 'New Client',
      email: invitation.email,
      account_id: newAccount.id,
      role: 'client',
    })

  if (userError) {
    return NextResponse.json({ error: 'Error creating user.' }, { status: 400 })
  }

  // 4. Atualizar o convite para accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return NextResponse.json({ success: true })
}