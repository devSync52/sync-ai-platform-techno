import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ success: false, message: 'Missing email or role' }, { status: 400 })
    }

    const result = await sendStaffInviteAction({ email, role })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[staff-invite] Unexpected error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}