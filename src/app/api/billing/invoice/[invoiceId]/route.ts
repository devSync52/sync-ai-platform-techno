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

    // 2 — Load items (paginate to avoid PostgREST max-rows=1000 truncation)
    const pageSize = 1000
    let offset = 0
    let itemsAll: any[] = []

    while (true) {
      const { data: page, error: pageErr } = await supabase
        .from('b1_v_invoice_items_1')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('usage_kind', { ascending: true })
        .order('occurred_at', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (pageErr) {
        console.error('[invoice_items]', pageErr)
        return NextResponse.json(
          { success: false, message: pageErr.message },
          { status: 500 }
        )
      }

      const rows = (page ?? []) as any[]
      itemsAll = itemsAll.concat(rows)

      // If we got less than a full page, we're done
      if (rows.length < pageSize) break

      offset += pageSize

      // Hard safety guard to prevent infinite loops in weird cases
      if (offset > 100_000) break
    }

    // Safety: fetch storage line explicitly (should be 0 or 1)
    const { data: storageRows, error: storageErr } = await supabase
      .from('b1_v_invoice_items_1')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('usage_kind', 'storage')
      .range(0, 10)

    if (storageErr) {
      console.warn('[invoice_items_storage] warning:', storageErr)
    }

    // Merge + de-dupe by item id
    const byId = new Map<string, any>()
    for (const it of (itemsAll ?? [])) {
      if (it?.id) byId.set(String(it.id), it)
    }
    for (const it of (storageRows ?? [])) {
      if (it?.id) byId.set(String(it.id), it)
    }

    const items = Array.from(byId.values())
      .sort((a, b) => {
        const ak = String(a?.usage_kind ?? '')
        const bk = String(b?.usage_kind ?? '')
        if (ak !== bk) return ak.localeCompare(bk)
        const ad = new Date(a?.occurred_at ?? 0).getTime()
        const bd = new Date(b?.occurred_at ?? 0).getTime()
        return ad - bd
      })

    // Normalize client label fields
    const clientLabel =
      invoice.client_name ??
      invoice.client_code ??
      invoice.client_account_id

    const storageCount = (items ?? []).filter((it: any) => String(it?.usage_kind) === 'storage').length
    console.log(
      '[invoice_GET] fetched=', (itemsAll ?? []).length,
      'deduped=', (items ?? []).length,
      'storage_count=',
      storageCount
    )

    return NextResponse.json(
      {
        success: true,
        meta: {
          items_count: (items ?? []).length,
          storage_count: storageCount,
        },
        data: {
          invoice: {
            ...invoice,
            client_label: clientLabel, // use in UI
            client_logo_url: invoice.client_logo_url ?? null,
            client_name: invoice.client_name ?? null,
          },
          items: items ?? [],
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
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
