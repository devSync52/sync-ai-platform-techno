'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/auth-helpers-nextjs'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [supabaseClient] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [session, setSession] = useState<Session | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      console.log('🔄 Initial session:', session)
      if (session) setSession(session)
      setIsLoaded(true)
    }

    init()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event)
      console.log('🪪 Session:', session)

      if (event === 'SIGNED_IN' && session) {
        setSession(session)
        router.push('/dashboard')
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseClient, router])

  if (!isLoaded) return null

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={session}>
      {children}
    </SessionContextProvider>
  )
}