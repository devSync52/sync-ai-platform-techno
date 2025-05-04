// src/app/onboarding/page.tsx
'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/login')
    }
  }, [session, router])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-600" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-xl font-bold">Bem-vindo! Complete seu cadastro ✍️</h1>
    </div>
  )
}