'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/utils/supabase/browser'

export function useOnboarding(userId: string | null) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)
  }

  const submit = useCallback(async (name: string, taxId: string) => {
    setLoading(true)
    setError(null)

    if (!userId) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    const slug = createSlug(name)
    console.log('[ONBOARDING] 🏢 Generated slug:', slug)

    try {
      const { data: existing, error: checkError } = await supabaseBrowser
  .from('accounts')
  .select('id')
  .eq('slug', slug)
  .maybeSingle() as any

      if (existing) {
        setError('This name is already taken. Please choose another.')
        setLoading(false)
        return
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ONBOARDING] Error checking slug:', checkError.message)
        setError('Error checking slug availability.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabaseBrowser.from('accounts').insert({
        name,
        slug,
        tax_id: taxId,
        created_by_user_id: userId,
      })

      if (insertError) {
        console.error('[ONBOARDING] ❌ Error creating account:', insertError.message)
        setError('Error creating account.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('[ONBOARDING] ❌ Unexpected error:', err)
      setError('Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [router, userId])

  return { submit, loading, error }
}
