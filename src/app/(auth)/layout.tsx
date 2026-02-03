'use client'

import { SupabaseProvider } from '@/components/supabase-provider'
import { Toaster } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@supabase/auth-helpers-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    const isResetPassword = window.location.pathname === '/reset-password'

    if (!session && !isResetPassword) {
      router.push('/login')
    }
  }, [session, router])

  return (
    <SupabaseProvider serverSession={null}>
      {children}
      <Toaster />
    </SupabaseProvider>
  )
}