import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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

  // Resolve role + account from DB to avoid stale/missing auth metadata.
  const { data: currentUserRow, error: currentUserError } = await supabase
    .from('users')
    .select('role, account_id')
    .eq('id', user.id)
    .maybeSingle()

  if (currentUserError || !currentUserRow?.account_id) {
    return NextResponse.json({ error: 'Missing account context' }, { status: 403 })
  }

  const role = String(currentUserRow.role || '').toLowerCase()
  const accountId = String(currentUserRow.account_id)

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
  const { data: children, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('parent_account_id', accountId)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fallback: if no child accounts, allow selecting own account.
  if (!children || children.length === 0) {
    const { data: ownAccount, error: ownError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle()

    if (ownError) return NextResponse.json({ error: ownError.message }, { status: 500 })
    return NextResponse.json({ clients: ownAccount ? [ownAccount] : [] })
  }

  return NextResponse.json({ clients: children })
}
