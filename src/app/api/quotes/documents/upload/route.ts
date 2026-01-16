import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// IMPORTANT: use service role server-side only
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {


    const form = await req.formData()
    const draftId = String(form.get('draftId') || '')
    const file = form.get('file') as File | null

    if (!draftId || !file) {
      return NextResponse.json({ error: 'draftId and file are required' }, { status: 400 })
    }

    // 2) Verificar se o draft existe (e opcional: se o user tem acesso)
    const { data: draft, error: dErr } = await supabaseAdmin
      .from('saip_quote_drafts')
      .select('id,user_id,account_id')
      .eq('id', draftId)
      .single()

    if (dErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const safeName = file.name
      .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 120) || 'file'

    const key = `${crypto.randomUUID()}-${safeName}`
    const path = `drafts/${draftId}/${key}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: upErr } = await supabaseAdmin.storage
      .from('quote_uploads')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
        cacheControl: '3600',
      })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 })
    }

    // Signed URL para preview
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from('quote_uploads')
      .createSignedUrl(path, 60 * 10)

    if (sErr) {
      return NextResponse.json({ path, url: null }, { status: 200 })
    }

    return NextResponse.json({ path, url: signed.signedUrl }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}