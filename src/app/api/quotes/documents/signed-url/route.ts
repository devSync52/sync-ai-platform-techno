

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side admin client (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const draftId = String(body?.draftId || '')
    const path = String(body?.path || '')

    if (!draftId || !path) {
      return NextResponse.json({ error: 'draftId and path are required' }, { status: 400 })
    }

    // Minimal authorization using app user id (same pattern as delete/upload)
    const callerUserId = req.headers.get('x-user-id')

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .select('id, user_id')
      .eq('id', draftId)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (!callerUserId || String(draft.user_id) !== String(callerUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate signed URL (10 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from('quote_uploads')
      .createSignedUrl(path, 60 * 10)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || 'Failed to create signed URL' }, { status: 400 })
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}