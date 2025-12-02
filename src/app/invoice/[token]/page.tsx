import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

type InvoiceItem = {
  description: string | null
  qty: number | null
  unit: string | null
  amount_cents: number
}

export default async function InvoicePublicPage({
  params,
}: { params: { token: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // 1) Resolve token → invoice_id
  const { data: tokenRow, error: tokenError } = await supabase
    .from('invoice_share_tokens_public_1')
    .select('invoice_id, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  if (tokenError) {
    return (
      <pre>
        Token query error:
        {JSON.stringify(tokenError, null, 2)}
      </pre>
    )
  }

  if (!tokenRow) {
    return <div>Token not found</div>
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return <div>Link expired</div>
  }

  // 2) header
  const { data: invoiceHeader, error: headerError } = await supabase
    .from('b1_v_invoice_public_1')
    .select('*')
    .eq('id', tokenRow.invoice_id)
    .maybeSingle()

  if (headerError) {
    return (
      <pre>
        Header query error:
        {JSON.stringify(headerError, null, 2)}
      </pre>
    )
  }

  if (!invoiceHeader) {
    return <div>Invoice header not found</div>
  }

  // 3) itens
  const { data: items, error: itemsError } = await supabase
    .from('b1_v_invoice_items_public_1')
    .select('*')
    .eq('invoice_id', tokenRow.invoice_id)

  if (itemsError) {
    return (
      <pre>
        Items query error:
        {JSON.stringify(itemsError, null, 2)}
      </pre>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">
        {invoiceHeader.client_name} — Invoice
      </h1>

      <p>
        Period: {invoiceHeader.period_start} → {invoiceHeader.period_end}
      </p>

      <div className="mt-8 space-y-2">
        {items?.map((item: InvoiceItem, idx: number) => (
          <div key={idx} className="flex justify-between border-b py-2">
            <div>
              <div>{item.description}</div>
              <div className="text-xs opacity-60">
                {item.qty} {item.unit}
              </div>
            </div>
            <strong>${(item.amount_cents / 100).toFixed(2)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-10 text-right text-2xl font-semibold">
        Total: ${(invoiceHeader.total_cents / 100).toFixed(2)}
      </div>
    </div>
  )
}