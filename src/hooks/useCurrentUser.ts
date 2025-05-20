import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

export function useCurrentUser() {
  const authUser = useUser()
  const supabase = useSupabaseClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!authUser?.id) return

    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!error) setUser(data)
    }

    fetchUser()
  }, [authUser, supabase])

  return user
}