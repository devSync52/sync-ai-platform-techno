import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerComponentClient({ cookies: () => cookieStore })
}