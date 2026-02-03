import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const parentAccountId =
    (user.app_metadata as any)?.parent_account_id ??
    (user.user_metadata as any)?.parent_account_id ??
    (user.app_metadata as any)?.account_id ??
    (user.user_metadata as any)?.account_id

  if (!parentAccountId) {
    return NextResponse.json(
      { error: 'Missing account context for user' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('b1_v_billing_configs_2')
    .select(
      `
        client_account_id,
        parent_account_id,
        assigned_warehouse,
        is_default,
        created_at,
        client_name,
        client_logo_url
      `
    )
    .eq('client_account_id', id)
    .eq('parent_account_id', parentAccountId)
    // Some clients have multiple rows (one per warehouse). Pick a deterministic “best” row.
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[billing/clients] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client info', message: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Client not found', message: 'No client for this id' },
      { status: 404 }
    )
  }

  // shape que o front já está esperando: json.client
  return NextResponse.json({ client: data })
}