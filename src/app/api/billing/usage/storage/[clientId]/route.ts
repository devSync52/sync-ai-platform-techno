import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET_storage(req: Request, ctx: any) {
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
  
    const { data: dataStorage, error, count } = await supabase
      .schema('public')
      .from('b1_v_storage_billing_daily')
      .select('*', { count: 'exact' })
      .eq('client_account_id', clientId)
      .gte('snapshot_date', `${startISO} 00:00:00+00`)
      .lte('snapshot_date', `${endISO} 23:59:59+00`)
      .order('snapshot_date', { ascending: false })
      .range(from, to)
  
    if (error) return new NextResponse(error.message, { status: 400 })
  
    const normalizedStorage = (dataStorage ?? []).map((r: any, idx: number) => ({
      id: r.id ?? `row-${idx}`,
      occurred_at: r.snapshot_date ?? null,
      order_id: r.order_id ?? null,
      service_code: r.service_code ?? null,
      description: 'Storage billing',
      kind: 'storage',
      quantity: Number(r.total_volume_cuft ?? 0),
      unit: 'cuft/day',
      rate_usd: Number(r.base_rate_usd_per_cuft_day ?? 0),
      amount_usd: Number(r.amount_usd ?? 0),
      source: r.source ?? 'extensiv',
      status: r.status ?? 'pending',
      metadata: typeof r.metadata === 'object' ? r.metadata : {},
    }))
  
    return NextResponse.json({
      data: normalizedStorage,
      page,
      pageSize,
      total: count ?? 0,
      start: startISO,
      end: endISO,
    })
  }

export async function GET(req: Request, ctx: any) {
  return GET_storage(req, ctx)
}