'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()

export default function AuthConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!tokenHash || type !== 'email') {
        setError('Invalid confirmation link.')
        return
      }

      const { data, error } = await supabase.auth.verifyOtp({
        type: 'email',
        token_hash: tokenHash
      })

      if (error || !data?.session) {
        setError('Confirmation failed. Please try again.')
        return
      }

      const userId = data.session.user.id
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      router.push(user ? '/dashboard' : '/onboarding')
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="flex flex-col items-center space-y-4">
        {error ? (
          <p className="text-red-600 text-sm text-center">{error}</p>
        ) : (
          <>
            <Loader2 className="animate-spin text-gray-600" size={32} />
            <p className="text-gray-600 text-sm">Confirming your account...</p>
          </>
        )}
      </div>
    </div>
  )
}
