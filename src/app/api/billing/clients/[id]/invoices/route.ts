import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const clientAccountId = params.id
    const parentAccountId = '80dddf96-059f-4d4a-86f0-69443ceb0db9'

    const { data: clientInfo, error: clientInfoError } = await supabase
      .from('b1_v_billing_configs')
      .select('client_name, client_logo_url')
      .eq('parent_account_id', parentAccountId)
      .eq('client_account_id', clientAccountId)
      .limit(1)
      .maybeSingle()

    if (clientInfoError) {
      console.error('[client_info] error', clientInfoError)
      return NextResponse.json(
        { success: false, message: 'Failed to load client info' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('b1_v_billing_invoices_1_view')
      .select(`
        id,
        parent_account_id,
        client_account_id,
        warehouse_id,
        period,
        currency_code,
        subtotal_cents,
        tax_cents,
        total_cents,
        status,
        issue_date,
        client_name,
        client_logo_url
      `)
      .eq('parent_account_id', parentAccountId)
      .eq('client_account_id', clientAccountId)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('[client_invoices] error', error)
      return NextResponse.json(
        { success: false, message: 'Failed to load invoices' },
        { status: 500 }
      )
    }

    const invoiceIds = (data ?? []).map((r: any) => r.id).filter(Boolean)

    // 1) Lookup warehouse names (for UX in the list)
    const { data: whRows, error: whErr } = await supabase
      .from('v_billing_warehouses')
      .select('id,name')
      .eq('parent_account_id', parentAccountId)

    if (whErr) {
      console.warn('[client_invoices] warehouse lookup error', whErr)
    }

    const warehouseNameById = new Map<string, string>()
    ;(whRows ?? []).forEach((w: any) => {
      if (w?.id) warehouseNameById.set(String(w.id), String(w.name ?? ''))
    })

    // 2) Compute totals from items to reflect edits immediately
    // (avoids stale totals if the header totals weren't recalculated yet)
    const totalsByInvoiceId = new Map<string, number>()
    if (invoiceIds.length > 0) {
      const { data: itemRows, error: itemsErr } = await supabase
        .from('b1_v_invoice_items_1')
        .select('invoice_id, amount_cents')
        .in('invoice_id', invoiceIds)

      if (itemsErr) {
        console.warn('[client_invoices] items lookup error', itemsErr)
      } else {
        ;(itemRows ?? []).forEach((it: any) => {
          const invId = it?.invoice_id
          if (!invId) return
          const cents = Number(it.amount_cents ?? 0)
          totalsByInvoiceId.set(String(invId), (totalsByInvoiceId.get(String(invId)) ?? 0) + cents)
        })
      }
    }

    // Mapear para o formato esperado pelo front (InvoiceRow)
    const rows = (data ?? []).map((row) => {
      const totalCents =
        totalsByInvoiceId.get(String(row.id)) ??
        row.total_cents ??
        row.subtotal_cents ??
        0

      const clientLabel =
        row.client_name ??
        row.client_account_id

      return {
        id: row.id as string,
        period: row.period as string,
        total: Number(totalCents) / 100,
        status: (row.status as string) || 'draft',
        issueDate: row.issue_date as string,

        // campos extras pro header
        client_label: clientLabel,
        client_name: row.client_name ?? null,
        client_logo_url: row.client_logo_url ?? null,
        warehouse_id: row.warehouse_id ?? null,
        warehouse_name: row.warehouse_id ? (warehouseNameById.get(String(row.warehouse_id)) ?? null) : null,
        currency_code: row.currency_code ?? null,
      }
    })

    return NextResponse.json(
      {
        success: true,
        client: {
          client_name: clientInfo?.client_name ?? null,
          client_logo_url: clientInfo?.client_logo_url ?? null,
        },
        data: rows,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (err: any) {
    console.error('[client_invoices] unexpected', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}