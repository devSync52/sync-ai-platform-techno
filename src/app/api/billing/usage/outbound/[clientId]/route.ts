// src/app/api/billing/usage/outbound/[clientId]/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function toISODate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Unified usage route
export async function GET(req: Request, ctx: any) {
  const clientId = (ctx?.params?.clientId as string)
  const supabase = createRouteHandlerClient({ cookies })
  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') ?? 50)))

  // Fallbacks de período: últimos 30 dias
  const now = new Date()
  const endISO = end ?? toISODate(now)
  const startISO = start ?? toISODate(new Date(now.getTime() - 29 * 24 * 3600 * 1000))

  // Sanitização simples de date (YYYY-MM-DD)
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRe.test(startISO) || !dateRe.test(endISO)) {
    return new NextResponse('Invalid date format. Use YYYY-MM-DD.', { status: 400 })
  }

  // Paginação via range
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const q = supabase
    .schema('public')
    .from('b1_v_usage_unified')
    .select('*', { count: 'exact' })
    .eq('client_account_id', clientId)
    .gte('occurred_at', `${startISO} 00:00:00+00`)
    .lte('occurred_at', `${endISO} 23:59:59+00`)
    .order('occurred_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await q
  if (error) return new NextResponse(error.message, { status: 400 })

  return NextResponse.json({
    data: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    start: startISO,
    end: endISO,
  })
}