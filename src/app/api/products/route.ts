import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get('account_id')

  if (!account_id) {
    return NextResponse.json({ success: false, error: 'Missing account_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('view_products_dashboard')
    .select('*')
    .eq('account_id', account_id)

  if (error) {
    console.error('[products] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, products: data })
}