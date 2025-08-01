

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await req.json()

  const { accountId, formData } = body

  if (!accountId || !formData) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  const keyHash = 'draft-' + accountId // You can customize this key logic

  const { error } = await supabase
    .from('saip_quote_drafts')
    .upsert({
      key_hash: keyHash,
      account_id: accountId,
      data: formData,
    }, { onConflict: 'key_hash' })

  if (error) {
    console.error('❌ Failed to save draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}