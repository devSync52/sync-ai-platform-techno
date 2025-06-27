'use client'

import { InviteStaffSection } from '@/components/InviteStaffSection'
import { useSession, useSupabase } from '@/components/supabase-provider'
import { useEffect, useState } from 'react'

export default function StaffPage() {
  const supabase = useSupabase()
  const session = useSession()
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const load = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', session.user.id)
        .single()
      if (!error && data?.account_id) setAccountId(data.account_id)
    }

    load()
  }, [session, supabase])

  if (!session) return null

  return (
    <div className="p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">Team Management</h1>
      {accountId && <InviteStaffSection accountId={accountId} />}
    </div>
  )
}