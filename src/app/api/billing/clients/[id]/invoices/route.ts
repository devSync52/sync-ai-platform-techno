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
    const parentAccountId = '80dddf96-059f-4d4a-86f0-69443ceb0db9' // mesmo que você já usa

    const { data, error } = await supabase
      .from('b1_v_billing_invoices_1_view')
      .select(
        `
        id,
        parent_account_id,
        client_account_id,
        period,
        subtotal_cents,
        tax_cents,
        total_cents,
        status,
        issue_date,
        client_name,
        client_logo_url
      `
      )
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

    // Mapear para o formato esperado pelo front (InvoiceRow)
    const rows = (data ?? []).map((row) => {
      const totalCents =
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
        status: row.status as 'draft' | 'open' | 'overdue' | 'paid',
        issueDate: row.issue_date as string,

        // campos extras pro header
        client_label: clientLabel,
        client_name: row.client_name ?? null,
        client_logo_url: row.client_logo_url ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (err: any) {
    console.error('[client_invoices] unexpected', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}