'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'

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
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    const slug = createSlug(name)

    try {
      // Verificar se já existe uma conta com o mesmo slug
      const { data: existing, error: checkError } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        setError('Esse nome já está em uso. Escolha outro.')
        setLoading(false)
        return
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ONBOARDING] Erro ao verificar slug:', checkError.message)
        setError('Erro ao verificar disponibilidade do nome.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('accounts').insert({
        name,
        slug,
        tax_id: taxId,
        created_by_user_id: userId,
      })

      if (insertError) {
        console.error('[ONBOARDING] ❌ Erro ao criar account:', insertError.message)
        setError('Erro ao criar conta.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('[ONBOARDING] ❌ Erro inesperado:', err)
      setError('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [router, userId])

  return { submit, loading, error }
}