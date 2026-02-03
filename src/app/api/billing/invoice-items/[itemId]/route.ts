import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { itemId } = params

  const supabase = (createRouteHandlerClient as any)({ cookies })

  try {
    // Chama a função que apaga o item E recalcula a invoice
    const { data, error } = await supabase.rpc(
      'billing_delete_invoice_item_1',
      {
        p_invoice_item_id: itemId,
      }
    )

    if (error) {
      console.error('[invoice-items/delete] RPC error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[invoice-items/delete] unexpected error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { itemId } = params
  const supabase = (createRouteHandlerClient as any)({ cookies })

  try {
    const body = await req.json()

    const { data, error } = await supabase.rpc(
      'invoice_item_update_1',
      {
        p_item_id: itemId,
        p_description: body.description ?? null,
        p_qty: body.qty ?? null,
        p_rate_cents: body.rate_cents ?? null,
        p_occurred_at: body.occurred_at ?? null,
      }
    )

    if (error) {
      console.error('[invoice-items/update] RPC error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[invoice-items/update] unexpected error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}