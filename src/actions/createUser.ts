'use server'

import { createServerClient } from '@/utils/supabase/server'

interface CreateUserParams {
  email: string
  metadata?: Record<string, unknown>
}

export async function createUserAction({ email, metadata }: CreateUserParams) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false, // Não exige o e-mail ser confirmado agora
      user_metadata: metadata || {},
    })

    if (error) {
      console.error('Error creating user:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: 'User created successfully!', user: data.user }
  } catch (err) {
    console.error('Unexpected error in createUserAction:', err)
    return { success: false, message: 'Unexpected server error.' }
  }
}