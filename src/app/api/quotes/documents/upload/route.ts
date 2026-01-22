import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

function getAccountContextFromUser(user: any): { accountId: string | null; role: string | null } {
  const role =
    (user?.user_metadata as any)?.role ??
    (user?.app_metadata as any)?.role ??
    null

  const accountId =
    (user?.app_metadata as any)?.parent_account_id ??
    (user?.user_metadata as any)?.parent_account_id ??
    (user?.app_metadata as any)?.account_id ??
    (user?.user_metadata as any)?.account_id ??
    null

  return { accountId: accountId ? String(accountId) : null, role: role ? String(role) : null }
}

export async function POST(req: Request) {
  try {
    const cookieStore = (await cookies()) as any

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            try {
              ;(cookieStore as any).delete(name)
            } catch {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 })
            }
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId: callerAccountId } = getAccountContextFromUser(user)
    if (!callerAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }


    const form = await req.formData()
    const draftId = String(form.get('draftId') || '')
    const file = form.get('file') as File | null

    if (!draftId || !file) {
      return NextResponse.json({ error: 'draftId and file are required' }, { status: 400 })
    }

    // 2) Verificar se o draft existe e se o user tem acesso (RLS + defense-in-depth)
    const { data: draft, error: dErr } = await supabase
      .from('saip_quote_drafts')
      .select('id,user_id,account_id')
      .eq('id', draftId)
      .maybeSingle()

    if (dErr) {
      return NextResponse.json({ error: dErr.message }, { status: 500 })
    }

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found or access denied (RLS).' },
        { status: 404 }
      )
    }

    const draftAccountId = String((draft as any).account_id ?? '')
    if (draftAccountId && draftAccountId !== callerAccountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const { error: upErr } = await supabase.storage
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
    const { data: signed, error: sErr } = await supabase.storage
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