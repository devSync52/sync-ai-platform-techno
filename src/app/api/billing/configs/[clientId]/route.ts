import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

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
      { error: 'Missing account context' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('billing_configs')
    .select('*')
    .eq('client_account_id', clientId)
    .eq('parent_account_id', parentAccountId)
    .maybeSingle()

  if (error) {
    console.error('[billing/configs] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ config: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

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
      { error: 'Missing account context' },
      { status: 403 }
    )
  }

  const body = await req.json()
  console.log('[billing/configs] PATCH body:', body)

  const { data: clientRow, error: clientErr } = await supabase
    .from('billing_clients_view')
    .select('parent_account_id, warehouse_id')
    .eq('client_account_id', clientId)
    .eq('parent_account_id', parentAccountId)
    .maybeSingle()

  if (clientErr || !clientRow?.parent_account_id) {
    console.error('[billing/configs] missing parent_account_id', clientErr, clientRow)
    return NextResponse.json(
      { error: 'Cannot find parent_account_id' },
      { status: 400 }
    )
  }

  const payload = {
    parent_account_id: clientRow.parent_account_id,
    client_account_id: clientId,
    warehouse_id: body.warehouse_id ?? clientRow.warehouse_id ?? null,
    billing_active: body.billing_active ?? true,
    billing_method: body.billing_method ?? 'postpaid',
    min_monthly_fee_cents: body.min_monthly_fee_cents ?? 0,
    discount_pct: body.discount_pct ?? 0,
    tax_exempt: body.tax_exempt ?? false,
    tax_id: body.tax_id ?? '',
    invoice_cycle: body.invoice_cycle ?? 'monthly',
    cut_off_day: body.cut_off_day ?? 1,
    template_primary_color: body.template_primary_color ?? '#3f2d90',
  }

  console.log('[billing/configs] PATCH upsert payload:', payload)

  const { data, error } = await supabase
    .from('billing_configs')
    .upsert(payload, {
      onConflict: 'client_account_id,warehouse_id',
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('[billing/configs] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to save config', details: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, config: data })
}