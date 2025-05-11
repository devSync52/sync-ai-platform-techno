import InviteStaffSection from '@/components/InviteStaffSection'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function StaffPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user?.id)
    .single()

  const accountId = userData?.account_id

  return (
    <div className="p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">Team Management</h1>
      {accountId && <InviteStaffSection accountId={accountId} />}
    </div>
  )
}