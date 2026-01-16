

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side admin client (Service Role). Never expose this key to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type EnrichmentFile = {
  name: string
  path: string
  url: string | null
  contentType: string | null
  size: number | null
  createdAt: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const draftId = String(body?.draftId || '')
    const path = String(body?.path || '')

    if (!draftId || !path) {
      return NextResponse.json({ error: 'draftId and path are required' }, { status: 400 })
    }

    // Minimal access check: require the caller to pass the current app user id.
    // This project currently does not carry a Supabase Auth session on the client.
    // If you already have a server-side auth helper, replace this with that.
    const callerUserId = req.headers.get('x-user-id')

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .select('id, user_id, preferences')
      .eq('id', draftId)
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (!callerUserId || String(draft.user_id) !== String(callerUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Best-effort remove from storage (ignore missing object)
    const { error: rmErr } = await supabaseAdmin.storage.from('quote_uploads').remove([path])
    if (rmErr) {
      // Keep going; we still want to remove the reference from the draft
      console.warn('⚠️ Storage remove error (continuing):', rmErr)
    }

    const prefs: any = (draft as any).preferences ?? {}
    const currentFiles: EnrichmentFile[] = Array.isArray(prefs.enrichment_files)
      ? (prefs.enrichment_files as EnrichmentFile[])
      : []

    const nextFiles = currentFiles.filter((f) => f?.path !== path)

    const nextPrefs = {
      ...prefs,
      enrichment_files: nextFiles,
    }

    const { error: updErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .update({ preferences: nextPrefs })
      .eq('id', draftId)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, files: nextFiles }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}