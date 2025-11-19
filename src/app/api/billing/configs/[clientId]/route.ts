import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * GET billing config para um clientId
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params

  // Usa exatamente o padrão que já estava funcionando em runtime
  // e "burla" o TS com cast em createRouteHandlerClient
  const supabase = (createRouteHandlerClient as any)({ cookies })

  const { data, error } = await supabase
    .from('billing_configs') // view pública
    .select('*')
    .eq('client_account_id', clientId)
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

/**
 * PATCH para atualizar ou criar config
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params

  const supabase = (createRouteHandlerClient as any)({ cookies })

  const body = await req.json()
  console.log('[billing/configs] PATCH body:', body)

  // Buscar parent_account_id (e warehouse, se tiver) do cliente
  const { data: clientRow, error: clientErr } = await supabase
    .from('billing_clients_view')
    .select('parent_account_id, warehouse_id')
    .eq('client_account_id', clientId)
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

    // campos expostos no front
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
    .from('billing_configs') // view pública updatable
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