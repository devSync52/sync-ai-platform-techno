import { createServerSupabaseClient } from '@/lib/supabase-server'
import ChannelsClient from './ChannelsClient'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return <div className="p-6">No session found.</div>
  }

  const { data: me, error: meError } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .maybeSingle()

  let accountId = me?.account_id ?? null

  if (!accountId) {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('created_by_user_id', user.id)
      .maybeSingle()

    if (!error) {
      accountId = account?.id ?? null
    }
  }

  if (meError || !accountId) {
    return <div className="p-6">Account not found.</div>
  }

  return <ChannelsClient accountId={accountId} />
}
