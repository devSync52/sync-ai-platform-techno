'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewSupportTicketForm } from '@/components/support/NewSupportTicketForm'
import { useSupabase, useSession } from '@/components/supabase-provider'
import { useState, useEffect } from 'react'

export default function NewTicketPage() {
  const session = useSession()
  const user = session?.user
  const userId = user?.id

  const [accountId, setAccountId] = useState<string | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    async function fetchAccountId() {
      if (!userId) return
      const { data, error } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data?.account_id) {
        setAccountId(data.account_id)
      }
    }
    fetchAccountId()
  }, [userId, supabase])

  if (!userId || accountId === null) {
    return <p className="text-muted-foreground">Loading session…</p>
  }
  if (!accountId) {
    return <p className="text-destructive">Account not found</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
        <Link
        href="/support"
        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to tickets
      </Link>
      <h1 className="text-2xl font-bold mb-4">Create New Support Ticket</h1>
      <div className="border shadow-md bg-white rounded-2xl p-6 gap-4">
      <NewSupportTicketForm userId={userId} accountId={accountId} />
      </div>
    </div>
  )
}