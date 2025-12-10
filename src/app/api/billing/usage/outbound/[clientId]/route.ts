
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function toISODate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET(req: Request, ctx: any) {
  const clientId = ctx?.params?.clientId as string
  const supabase = createRouteHandlerClient({ cookies })
  const url = new URL(req.url)

  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') ?? 50)))

  const now = new Date()
  const endISO = end ?? toISODate(now)
  const startISO = start ?? toISODate(new Date(now.getTime() - 29 * 24 * 3600 * 1000))
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRe.test(startISO) || !dateRe.test(endISO))
    return new NextResponse('Invalid date format. Use YYYY-MM-DD.', { status: 400 })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .schema('public')
    .from('b1_v_invoice_usage_unified')
    .select('*', { count: 'exact' })
    .eq('client_account_id', clientId)
    .gte('snapshot_date', `${startISO} 00:00:00+00`)
    .lte('snapshot_date', `${endISO} 23:59:59+00`)
    .order('snapshot_date', { ascending: false })
    .range(from, to)

  if (error) return new NextResponse(error.message, { status: 400 })

  // Normalização pro front
  const normalized = (data ?? []).map((r: any, idx: number) => ({
    id: r.id ?? `row-${idx}`,
    occurred_at: r.occurred_at ?? r.order_date ?? r.snapshot_date ?? null,
    order_id: r.order_id ?? r.ref_id ?? null,
    service_code: r.service_code ?? r.category ?? r.kind ?? null,
    description: r.description ?? r.notes ?? r.kind ?? null,
    kind: r.kind ?? r.source ?? null,
    quantity: Number(r.quantity ?? r.unit_count ?? 0),
    unit: r.unit ?? 'unit',
    rate_usd: Number(r.rate_usd ?? r.unit_rate_usd ?? 0),
    amount_usd: Number(r.amount_usd ?? r.total_usd ?? (r.rate_usd ?? 0) * (r.quantity ?? 0)),
    source: r.source ?? 'extensiv',
    status: r.status ?? 'pending',
    metadata: typeof r.metadata === 'object' ? r.metadata : {},
  }))

  return NextResponse.json({
    data: normalized,
    page,
    pageSize,
    total: count ?? 0,
    start: startISO,
    end: endISO,
  })
}