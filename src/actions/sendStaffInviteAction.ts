'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function sendStaffInviteAction({
  email,
  role,
  accountId,
  invitedBy
}: {
  email: string
  role: 'staff-client' | 'admin' | 'staff-admin' | 'staff-user' | 'client'
  accountId: string
  invitedBy: string
}) {
  const password = generateSecurePassword() // ou defina uma fixa para testes
  const name = email.split('@')[0] // nome simplificado
  console.log('[sendStaffInviteAction] Enviando convite para:', {
    email, accountId, invitedBy, role
  })

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_staff_invite_custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        accountId,
        invitedBy
      })
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unknown error')

    // Best-effort: if user row already exists, ensure lineage is set.
    // (Newly accepted users are handled by the accept-invite finalization step.)
    const normalizedEmail = email.trim().toLowerCase()
    const { error: lineageError } = await supabaseAdmin
      .from('users')
      .update({ created_by_user_id: invitedBy })
      .eq('email', normalizedEmail)
      .is('created_by_user_id', null)

    if (lineageError) {
      console.warn('[sendStaffInviteAction] lineage backfill warning:', lineageError.message)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[sendStaffInviteAction] Erro:', err)
    return { success: false, message: err.message }
  }
}

function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  return password
}
