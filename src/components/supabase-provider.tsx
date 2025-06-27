'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState, createContext, useContext } from 'react'
import { Database } from '@/types/supabase'

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient<Database>>
  session: Session | null
}

const Context = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({
  children,
  serverSession,
}: {
  children: React.ReactNode
  serverSession: Session | null
}) {
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(serverSession)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
  
      if (event === 'SIGNED_OUT') {
        const pathname = window.location.pathname
        const isResetPage = pathname.startsWith('/reset-password') || pathname.startsWith('/accept-invite')
        
        if (!isResetPage) {
          router.push('/login')
        }
      }
  
      if (event === 'SIGNED_IN') {
        router.refresh()
      }
    })
  
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.supabase
}

export const useSession = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSession must be used within a SupabaseProvider')
  }
  return context.session
}