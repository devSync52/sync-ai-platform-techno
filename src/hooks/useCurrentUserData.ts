import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

type AppUser = {
  name: string
  email: string
  role: string
}

export function useCurrentUserData() {
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const [userData, setUserData] = useState<AppUser | null>(null)

  useEffect(() => {
    if (!authUser?.id) return

    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('id', authUser.id)
        .single()

      if (!error && data) {
        setUserData(data)
      }
    }

    fetchUser()
  }, [authUser])

  return userData
}