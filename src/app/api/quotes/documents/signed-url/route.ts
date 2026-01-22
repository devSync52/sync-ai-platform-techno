import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getAccountIdFromUser(user: any): string | null {
  const accountId =
    (user?.app_metadata as any)?.parent_account_id ??
    (user?.user_metadata as any)?.parent_account_id ??
    (user?.app_metadata as any)?.account_id ??
    (user?.user_metadata as any)?.account_id ??
    null

  return accountId ? String(accountId) : null
}

export async function POST(req: Request) {
  try {
    const cookieStore = (await cookies()) as any

    const supabase = createServerClient(
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

    const callerAccountId = getAccountIdFromUser(user)
    if (!callerAccountId) {
      return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const draftId = String(body?.draftId || '')
    const path = String(body?.path || '')

    if (!draftId || !path) {
      return NextResponse.json({ error: 'draftId and path are required' }, { status: 400 })
    }

    const { data: draft, error: draftErr } = await supabase
      .from('saip_quote_drafts')
      .select('id, account_id')
      .eq('id', draftId)
      .maybeSingle()

    if (draftErr) {
      return NextResponse.json({ error: draftErr.message }, { status: 500 })
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

    const { data, error } = await supabase.storage
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