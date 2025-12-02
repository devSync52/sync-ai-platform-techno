import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { invoiceId: string } }
) {
  const invoiceId = params.invoiceId
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // 1 — Load invoice header
    const { data: invoice, error: invError } = await supabase
      .from('b1_v_billing_invoices_1_view')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invError) {
      console.error('[invoice_header]', invError)
      return NextResponse.json(
        { success: false, message: invError.message },
        { status: 500 }
      )
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      )
    }

    // 2 — Load items
    const { data: items, error: itemsError } = await supabase
      .from('b1_v_invoice_items_1')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('usage_kind', { ascending: true })
      .order('occurred_at', { ascending: true })

    if (itemsError) {
      console.error('[invoice_items]', itemsError)
      return NextResponse.json(
        { success: false, message: itemsError.message },
        { status: 500 }
      )
    }

    // Normalize client label fields
const clientLabel =
invoice.client_name ??
invoice.client_code ??
invoice.client_account_id

return NextResponse.json({
success: true,
data: {
  invoice: {
    ...invoice,
    client_label: clientLabel, // use in UI
    client_logo_url: invoice.client_logo_url ?? null,
    client_name: invoice.client_name ?? null
  },
  items: items ?? []
}
})
  } catch (err: any) {
    console.error('[invoice_GET_unexpected]', err)
    return NextResponse.json(
      { success: false, message: 'Unexpected error', details: err?.message },
      { status: 500 }
    )
  }
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  const supabase = (createRouteHandlerClient as any)({ cookies })
  const { invoiceId } = params

  console.log('[billing/invoices] DELETE invoiceId=', invoiceId)

  const { data, error } = await supabase.rpc(
    'billing_delete_invoice_1',
    { p_invoice_id: invoiceId }
  )

  if (error) {
    console.error('[billing/invoices] DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete invoice',
        details: error.message,
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    invoiceId,
    data,
  })
}
