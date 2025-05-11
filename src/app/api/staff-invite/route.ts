import { createServerClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ success: false, message: 'Missing email or role' }, { status: 400 })
    }

    const supabase = createServerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const invitedBy = session?.user.id

    if (!invitedBy) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('created_by_user_id', invitedBy)
      .maybeSingle()

    if (error || !account) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 })
    }

    const result = await sendStaffInviteAction({
      email,
      role,
      accountId: account.id,
      invitedBy
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[staff-invite] Unexpected error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}