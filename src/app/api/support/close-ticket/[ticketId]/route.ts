import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/supabase-config'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const ticketId = url.pathname.split('/').pop()

  const supabase = createClient(
    supabaseConfig.supabaseUrl,
    supabaseConfig.supabaseServiceRoleKey
  )

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id
  const role = user.user_metadata?.role

  if (!['admin', 'staff-admin', 'staff-user'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', userId)
    .single()

  const { data: ticket, error: ticketError } = await supabase
    .from('saip_support_tickets')
    .select('account_id')
    .eq('id', ticketId)
    .maybeSingle()

  const isStaff = ['admin', 'staff-admin'].includes(role)

  if (ticketError || !ticket || (!isStaff && ticket.account_id !== userRecord?.account_id)) {
    return NextResponse.json({ error: 'Ticket not found or not allowed' }, { status: 404 })
  }

  const { error } = await supabase
    .from('saip_support_tickets')
    .update({ status: 'closed' })
    .eq('id', ticketId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}