'use client'

import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import AIExpertChat from '@/components/ai/AIExpertChat'

export default function ChatPage() {
  const user = useUser()
  const supabase = useSupabaseClient()

  const [userType, setUserType] = useState<'owner' | 'client' | 'end_client' | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('role, account_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[ChatPage] ❌ Failed to fetch user role:', error.message)
        return
      }

      const role = data?.role
      const accId = data?.account_id

      if (!accId) {
        console.warn('[ChatPage] ⚠️ No account_id found for user')
        return
      }

      if (['admin', 'staff-admin', 'staff-user'].includes(role)) {
        setUserType('owner')
      } else if (role === 'client') {
        setUserType('client')
      } else if (role === 'customer') {
        setUserType('end_client')
      } else {
        console.warn('[ChatPage] ⚠️ Unknown user role:', role)
      }

      setAccountId(accId)
      setLoading(false)
    }

    fetchUserRole()
  }, [user])

  if (loading || !user || !userType || !accountId) {
    return <div className="p-6 text-gray-600">Loading chat assistant...</div>
  }

  return (
    <div className="h-full">
      <AIExpertChat
        user_id={user.id}
        account_id={accountId}
        user_type={userType}
      />
    </div>
  )
}