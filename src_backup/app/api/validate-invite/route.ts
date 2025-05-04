import { NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ success: false, message: 'Missing token.' }, { status: 400 })
  }

  const supabase = await createServerClient()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('email')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (error || !invitation) {
    return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, email: invitation.email })
}