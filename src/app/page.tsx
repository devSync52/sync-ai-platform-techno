'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Home() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  return null
}