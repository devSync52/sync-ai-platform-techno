'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function AuthRedirectPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: session } = await supabase.auth.getUser()

      if (!session.user?.id) {
        router.push('/login')
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()

      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    }

    handleRedirect()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="animate-spin text-gray-600" size={32} />
        <p className="text-gray-600 text-sm">Loading your workspace...</p>
      </div>
    </div>
  )
}