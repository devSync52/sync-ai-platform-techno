import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const { channelId } = await req.json()

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('*')
    .eq('channel_id', channelId)
    .maybeSingle()

  if (inviteError || !invitation) {
    return Response.json({ error: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.status === 'accepted') {
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', invitation.email)

    const { data: usersList } = await supabase.auth.admin.listUsers()
    const matchingUser = usersList?.users?.find(u => u.email === invitation.email)

    if (matchingUser?.id) {
      await supabase.auth.admin.deleteUser(matchingUser.id)
    }

    if (userDeleteError) {
      return Response.json({ error: 'Failed to delete user' }, { status: 500 })
    }
  }

  const { error: deleteError } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitation.id)

  if (deleteError) {
    return Response.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }

  return Response.json({ success: true })
}