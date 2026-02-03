import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getAccountContext(user: any) {
  const role = user?.user_metadata?.role ?? user?.app_metadata?.role ?? null
  const accountId =
    user?.app_metadata?.account_id ??
    user?.user_metadata?.account_id ??
    user?.app_metadata?.parent_account_id ??
    user?.user_metadata?.parent_account_id ??
    null
  return { role, accountId }
}

export async function GET(_req: NextRequest) {
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

  const { role, accountId } = getAccountContext(user)
  if (!accountId) {
    return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
  }

  // Se for client/staff-client, devolve só a própria conta
  if (role === 'client' || role === 'staff-client') {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clients: data ? [data] : [] })
  }

  // Caso contrário, devolve os filhos
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('parent_account_id', accountId)
    .not('external_id', 'is', null)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data ?? [] })
}