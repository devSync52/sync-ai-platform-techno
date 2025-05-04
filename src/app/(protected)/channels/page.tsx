import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import ChannelsClient from './ChannelsClient'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    return <div className="p-6">No session found.</div>
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('created_by_user_id', session.user.id)
    .maybeSingle()

  if (error || !account) {
    return <div className="p-6">Account not found.</div>
  }

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('account_id', account.id)

  const { data: marketplaces } = await supabase
    .from('channel_marketplaces')
    .select('*')

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')

  return (
    <ChannelsClient
      accountId={account.id}
      channels={channels || []}
      marketplaces={marketplaces || []}
      invitations={invitations || []}
    />
  )
}