'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.refresh() // Middleware vai decidir pra onde ir
      } else {
        router.push('/login')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-600" size={32} />
    </div>
  )
}
