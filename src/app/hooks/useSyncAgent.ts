import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

interface UseSyncAgentOptions {
  question: string
  accountId: string
  sessionId: string
  enabled?: boolean
}

interface SyncAgentResponse {
  output: string
}

const fetcher = async ([url, payload]: [string, any]) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Erro na IA')
  }

  const data: SyncAgentResponse = await res.json()
  return data.output
}

export function useSyncAgent({ question, accountId, sessionId, enabled = true }: UseSyncAgentOptions) {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)

  // 🎯 Mapeia a role do banco para o tipo de usuário
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[useSyncAgent] ❌ Erro ao buscar role:', error.message)
        return
      }

      const role = data?.role

      if (['admin', 'staff-admin', 'staff-user'].includes(role)) {
        setUserType('owner')
      } else if (role === 'client') {
        setUserType('client')
      } else if (role === 'customer') {
        setUserType('end_client')
      } else {
        console.warn('[useSyncAgent] ⚠️ Role não reconhecida:', role)
      }
    }

    fetchRole()
  }, [user, supabase])

  const shouldFetch = enabled && !!question && !!accountId && !!sessionId && !!userType

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ['/api/ai-agent', { question, accountId, sessionId, userType }] : null,
    fetcher
  )

  const refetch = useCallback(() => {
    if (shouldFetch) mutate()
  }, [shouldFetch, mutate])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}