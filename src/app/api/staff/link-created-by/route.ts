import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRow, error: rowError } = await supabaseAdmin
      .from('users')
      .select('id, email, created_by_user_id')
      .eq('id', user.id)
      .maybeSingle()

    if (rowError || !userRow) {
      return NextResponse.json({ success: false, message: 'User row not found' }, { status: 404 })
    }

    if (userRow.created_by_user_id) {
      return NextResponse.json({ success: true, linked: false })
    }

    const normalizedEmail = (userRow.email ?? user.email ?? '').trim().toLowerCase()
    if (!normalizedEmail) {
      return NextResponse.json({ success: true, linked: false })
    }

    const { data: inviteLog } = await supabaseAdmin
      .from('invite_logs')
      .select('invited_by')
      .eq('email', normalizedEmail)
      .not('invited_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const creatorId = inviteLog?.invited_by ?? null
    if (!creatorId) {
      return NextResponse.json({ success: true, linked: false })
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ created_by_user_id: creatorId })
      .eq('id', user.id)
      .is('created_by_user_id', null)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, linked: true })
  } catch (error) {
    console.error('[api/staff/link-created-by] error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
