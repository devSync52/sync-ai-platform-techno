import { create } from 'zustand'
import { useEffect } from 'react'
import { useSession, useSupabase } from '@/components/supabase-provider'

interface CurrentUser {
  id: string
  name: string
  email: string
  role?: string
  avatarUrl?: string
  account_id?: string
}

interface CurrentUserStore {
  user: CurrentUser | null
  setUser: (u: CurrentUser | null) => void
  fetchUser: (supabase: any, userId: string) => Promise<void>
}

export const useCurrentUserStore = create<CurrentUserStore>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  fetchUser: async (supabase, userId) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, account_id')
      .eq('id', userId)
      .single()

    const { data: detailsData, error: detailsError } = await supabase
      .from('user_details')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (userData) {
      set({
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatarUrl: detailsData?.avatar_url ?? null,
          account_id: userData.account_id
        }
      })
    }

    if (userError) console.error('User fetch error:', userError.message)
    if (detailsError) console.error('Details fetch error:', detailsError.message)
  }
}))

// Hook para usar
export function useCurrentUser() {
  const session = useSession()
  const supabase = useSupabase()
  const { user, fetchUser } = useCurrentUserStore()

  useEffect(() => {
    const userId = session?.user?.id
    if (userId) fetchUser(supabase, userId)
  }, [session?.user?.id])

  return user
}
