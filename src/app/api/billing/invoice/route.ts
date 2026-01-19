import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type DbInvoiceRow = {
  id: string
  parent_account_id: string
  client_account_id: string
  warehouse_id: string | null
  period_start: string
  period_end: string
  period: string
  currency_code: string
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  status: string
  issue_date: string | null
  client_name: string | null
  client_logo_url: string | null
}

export async function GET() {
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
    .from('b1_v_billing_invoices_1_view')
    .select(
      `
      id,
      parent_account_id,
      client_account_id,
      warehouse_id,
      period_start,
      period_end,
      period,
      currency_code,
      subtotal_cents,
      tax_cents,
      total_cents,
      status,
      issue_date,
      client_name,
      client_logo_url
    `
    )
    .eq('parent_account_id', parentAccountId)
    .order('issue_date', { ascending: false })

  if (error) {
    console.error('[api/billing/invoices] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load invoices', details: error.message },
      { status: 500 }
    )
  }

  const rows = (data ?? []) as DbInvoiceRow[]

  const payload = rows.map((row) => ({
    id: row.id,

    client: row.client_name ?? row.client_account_id,

    clientName: row.client_name,
    clientLogoUrl: row.client_logo_url,
    parentAccountId: row.parent_account_id,
    clientAccountId: row.client_account_id,
    warehouseId: row.warehouse_id,
    period: row.period,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    currencyCode: row.currency_code,
    subtotal: (row.subtotal_cents ?? 0) / 100,
    tax: (row.tax_cents ?? 0) / 100,
    total: (row.total_cents ?? 0) / 100,
    status: row.status,
    issueDate: row.issue_date,

    dueDate: row.period_end,
  }))

  return NextResponse.json({ data: payload })
}