import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * GET – lista serviços efetivos + overrides do cliente
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params
  const supabase = (createRouteHandlerClient as any)({ cookies })

  // Aqui você pode apontar pra sua view de serviços efetivos:
  // ex: public.b1_v_billing_services_by_client ou similar
  const { data, error } = await supabase
    .from('b1_v_billing_services_by_client') // ajuste o nome da view se for outro
    .select('*')
    .eq('client_account_id', clientId)

  if (error) {
    console.error('[billing/services] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client services', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ services: data ?? [] })
}

/**
 * PATCH – salva overrides de serviços do cliente
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params
  const supabase = (createRouteHandlerClient as any)({ cookies })

  const body = await req.json()
  console.log('[billing/services] PATCH body:', body)

  const overrides = Array.isArray(body.overrides) ? body.overrides : []

  if (!overrides.length) {
    return NextResponse.json(
      { error: 'No overrides provided' },
      { status: 400 }
    )
  }

  // Buscar parent_account_id e warehouse padrão do cliente
  const { data: clientRow, error: clientErr } = await supabase
    .from('billing_clients_view')
    .select('parent_account_id, warehouse_id')
    .eq('client_account_id', clientId)
    .maybeSingle()

  if (clientErr || !clientRow?.parent_account_id) {
    console.error('[billing/services] missing parent_account_id', clientErr, clientRow)
    return NextResponse.json(
      { error: 'Cannot find parent_account_id for client' },
      { status: 400 }
    )
  }

  // Montar payload para upsert
  const rows = overrides
    .filter((o: any) => !!o.service_id)
    .map((o: any) => {
      // Aceita override_rate_cents ou override_rate_usd
      let override_rate_cents: number | null = null

      if (typeof o.override_rate_cents === 'number') {
        override_rate_cents = o.override_rate_cents
      } else if (typeof o.override_rate_usd === 'number') {
        override_rate_cents = Math.round(o.override_rate_usd * 100)
      }

      return {
        parent_account_id: clientRow.parent_account_id,
        client_account_id: clientId,
        warehouse_id: o.warehouse_id ?? clientRow.warehouse_id ?? null,
        service_id: o.service_id,
        override_rate_cents,
        active: o.active ?? true,
      }
    })

  console.log('[billing/services] PATCH upsert rows:', rows)

  if (!rows.length) {
    return NextResponse.json(
      { error: 'No valid overrides to upsert' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
  .from('billing_client_service_overrides')
  .upsert(rows, { onConflict: 'client_account_id,warehouse_id,service_id' })
  .select()

  if (error) {
    console.error('[billing/services] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to save overrides', details: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, overrides: data })
}