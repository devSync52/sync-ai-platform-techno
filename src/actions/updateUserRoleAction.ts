'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function updateUserRoleAction({
  userId,
  newRole
}: {
  userId: string
  newRole: string
}) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: newRole
    }
  })

  if (error) {
    return { success: false, error }
  }

  return { success: true }
}