import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params
  if (!clientId) {
    return NextResponse.json({ error: 'Missing client id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('billing_configs')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
