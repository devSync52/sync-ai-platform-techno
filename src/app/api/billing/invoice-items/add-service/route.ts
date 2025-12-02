import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: NextRequest) {
  const supabase = (createRouteHandlerClient as any)({ cookies })

  const body = await req.json()
  const { invoiceId, globalServiceId, qty, rateCents, occurredAt } = body

  try {
    const { data, error } = await supabase.rpc(
      'billing_add_invoice_service_item_1',
      {
        p_global_service_id: globalServiceId,
        p_invoice_id: invoiceId,
        p_occurred_at: occurredAt,
        p_qty: qty,
        p_rate_cents: rateCents,
      }
    )

    if (error) {
      console.error('[invoice-items/add-service] RPC error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to add service', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[invoice-items/add-service] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Unexpected server error', details: err.message },
      { status: 500 }
    )
  }
}