import { createServerClient } from '@/utils/supabase/server'
import ChannelsClient from './ChannelsClient'

export default async function ChannelsPage() {
  const supabase = createServerClient()

  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')

  const { data: marketplaces, error: marketplacesError } = await supabase
    .from('channel_marketplaces')
    .select('*')

  const { data: invitations, error: invitationsError } = await supabase
    .from('invitations')
    .select('*')

  if (channelsError || marketplacesError || invitationsError) {
    console.error({ channelsError, marketplacesError, invitationsError })
    // Aqui você pode exibir uma página de erro se quiser
    return <div className="p-6">Error loading data.</div>
  }

  return (
    <ChannelsClient
      channels={channels || []}
      marketplaces={marketplaces || []}
      invitations={invitations || []}
    />
  )
}