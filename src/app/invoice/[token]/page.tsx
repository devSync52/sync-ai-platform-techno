import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
type InvoiceItem = {
  invoice_id: string
  usage_kind: string | null
  description: string | null
  qty: number | null
  unit: string | null
  amount_cents: number
  metadata: any
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
    .from('b1_v_invoice_items_public_2')
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

  const formatMoney = (cents: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format((Number(cents) || 0) / 100)
    } catch {
      return `$${((Number(cents) || 0) / 100).toFixed(2)}`
    }
  }

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-'
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return String(d)
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
  }

  type BucketKey = 'unloading' | 'inbound' | 'storage' | 'outbound' | 'return' | 'insurance' | 'extra'

  const normalize = (v: string | null | undefined) => (v ?? '').toLowerCase().trim()

  const getBucketKey = (item: InvoiceItem): BucketKey => {
    const meta = item.metadata || {}
    const usage = normalize(item.usage_kind)
    const typeLabel = normalize(meta.type_label || meta.typeLabel)
    const category = normalize(meta.category)
    const source = normalize(meta.source)
    const desc = normalize(item.description)

    // Storage
    if ([usage, typeLabel, category, desc].some((s) => s.includes('storage'))) return 'storage'

    // Unloading
    if (
      ['crossdock', 'cross-dock', 'drayage', 'rail terminal', 'port', 'airport'].some((k) =>
        [usage, typeLabel, category, source, desc].some((s) => s.includes(k))
      )
    )
      return 'unloading'

    // Inbound
    if (
      ['inbound', 'barcode', 'scan', 'scanning'].some((k) =>
        [usage, typeLabel, category, source, desc].some((s) => s.includes(k))
      )
    )
      return 'inbound'

    // Insurance
    if (
      ['insurance'].some((k) => [usage, typeLabel, category, source, desc].some((s) => s.includes(k)))
    )
      return 'insurance'

    // Returns
    if (
      ['return', 'returns'].some((k) => [usage, typeLabel, category, source, desc].some((s) => s.includes(k)))
    )
      return 'return'

    // Outbound
    if (
      ['outbound', 'ecom', 'e-commerce', 'shipping', 'fulfillment', 'label', 'wrapping'].some((k) =>
        [usage, typeLabel, category, source, desc].some((s) => s.includes(k))
      )
    )
      return 'outbound'

    // Extras
    return 'extra'
  }

  const getOutboundSubLabel = (item: InvoiceItem) => {
    const meta = item.metadata || {}
    const raw = normalize(meta.type_label || meta.typeLabel || meta.source || item.description)

    if (raw.includes('outbound_ecom') || raw.includes('outbound-ecom') || raw.includes('outbound ecom') || raw.includes('ecom'))
      return 'E-commerce Transaction'

    if (raw.includes('outbound_fulfillment') || raw.includes('outbound-fulfillment') || raw.includes('fulfillment'))
      return 'Fulfillment Units'

    if (raw.includes('standard labeling') || (raw.includes('label') && !raw.includes('barcode')))
      return 'Standard Labeling'

    if (raw.includes('wrapping')) return 'Wrapping'

    if (raw.includes('retail')) return 'Retail Transaction (FBA)'

    return 'Other'
  }

  const bucketOrder: { key: BucketKey; label: string }[] = [
    { key: 'unloading', label: 'Unloading' },
    { key: 'inbound', label: 'Inbound' },
    { key: 'storage', label: 'Storage' },
    { key: 'outbound', label: 'Outbound' },
    { key: 'return', label: 'Return' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'extra', label: 'Extras' },
  ]

  const itemsSafe: InvoiceItem[] = (items || []) as any

  const groupedByBucket = new Map<BucketKey, InvoiceItem[]>()
  for (const it of itemsSafe) {
    const k = getBucketKey(it)
    const prev = groupedByBucket.get(k) || []
    prev.push(it)
    groupedByBucket.set(k, prev)
  }

  const bucketTotals = new Map<BucketKey, number>()
  const bucketCounts = new Map<BucketKey, number>()
  for (const b of bucketOrder) {
    const list = groupedByBucket.get(b.key) || []
    bucketCounts.set(b.key, list.length)
    bucketTotals.set(
      b.key,
      list.reduce((sum, it) => sum + (Number(it.amount_cents) || 0), 0)
    )
  }

  const computedSubtotalCents = bucketOrder.reduce(
    (sum, b) => sum + (bucketTotals.get(b.key) || 0),
    0
  )

  const currency = invoiceHeader.currency_code || 'USD'

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img/sync/sync-fulfillment-logo.png"
            alt="SynC Fulfillment"
            className="h-12 sm:h-14 md:h-16 w-auto"
          />
        </div>
        
        
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {invoiceHeader.client_name} — Invoice
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Billing period: {formatDate(invoiceHeader.period_start)} → {formatDate(invoiceHeader.period_end)}
              </p>
              <p className="text-sm text-muted-foreground">
                Issued on: {formatDate(invoiceHeader.issued_at)} · Currency: {currency}
              </p>
            </div>
            

            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice total</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatMoney(invoiceHeader.total_cents ?? computedSubtotalCents, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Subtotal: {formatMoney(computedSubtotalCents, currency)}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {bucketOrder.map((b) => (
              <div key={b.key} className="rounded-lg border bg-muted/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{b.label}</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatMoney(bucketTotals.get(b.key) || 0, currency)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(bucketCounts.get(b.key) || 0)} item{(bucketCounts.get(b.key) || 0) === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mt-8 rounded-xl border bg-background shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Details are hidden by default. Expand a section to view line items.
            </p>
          </div>

          <div className="divide-y">
            {bucketOrder.map((b) => {
              const list = groupedByBucket.get(b.key) || []
              const total = bucketTotals.get(b.key) || 0

              // Hide empty categories
              if (list.length === 0) return null

              // OUTBOUND has subgroups
              if (b.key === 'outbound') {
                const groups = new Map<string, { items: InvoiceItem[]; total: number }>()
                for (const it of list) {
                  const label = getOutboundSubLabel(it)
                  const prev = groups.get(label) || { items: [], total: 0 }
                  prev.items.push(it)
                  prev.total += Number(it.amount_cents) || 0
                  groups.set(label, prev)
                }

                const preferred = [
                  'E-commerce Transaction',
                  'Fulfillment Units',
                  'Retail Transaction (FBA)',
                  'Standard Labeling',
                  'Wrapping',
                  'Other',
                ]

                const orderedGroups = Array.from(groups.entries()).sort((a, c) => {
                  const ai = preferred.indexOf(a[0])
                  const bi = preferred.indexOf(c[0])
                  if (ai === -1 && bi === -1) return a[0].localeCompare(c[0])
                  if (ai === -1) return 1
                  if (bi === -1) return -1
                  return ai - bi
                })

                return (
                  <details key={b.key} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 hover:bg-muted/20">
                      <div>
                        <p className="text-sm font-semibold">{b.label}</p>
                        <p className="text-xs text-muted-foreground">{list.length} items</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{formatMoney(total, currency)}</span>
                        <span className="text-xs text-muted-foreground group-open:rotate-180 transition">▾</span>
                      </div>
                    </summary>

                    <div className="px-6 pb-6">
                      <div className="mt-2 rounded-lg border">
                        {orderedGroups.map(([label, payload]) => (
                          <details key={label} className="group/sub">
                            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 hover:bg-muted/10 border-b last:border-0">
                              <div>
                                <p className="text-sm font-semibold">OUTBOUND — {label}</p>
                                <p className="text-xs text-muted-foreground">{payload.items.length} items</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">{formatMoney(payload.total, currency)}</span>
                                <span className="text-xs text-muted-foreground group-open/sub:rotate-180 transition">▾</span>
                              </div>
                            </summary>

                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                                  <tr>
                                    <th className="px-4 py-2 text-left">Order</th>
                                    <th className="px-4 py-2 text-left">Reference</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {payload.items.map((it, idx) => {
                                    const meta = it.metadata || {}
                                    const orderId = meta.order_id || meta.orderId || '-'
                                    const ref = meta.sellercloud_cs_key || meta.sellercloud || it.description || '-'
                                    return (
                                      <tr key={idx} className="hover:bg-muted/10">
                                        <td className="px-4 py-2">{orderId}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{ref}</td>
                                        <td className="px-4 py-2 text-right">{it.qty ?? '-'}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{formatMoney(it.amount_cents, currency)}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  </details>
                )
              }

              // Default categories (single level)
              return (
                <details key={b.key} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 hover:bg-muted/20">
                    <div>
                      <p className="text-sm font-semibold">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{list.length} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatMoney(total, currency)}</span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition">▾</span>
                    </div>
                  </summary>

                  <div className="px-6 pb-6">
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-right">Qty</th>
                            <th className="px-4 py-2 text-left">Unit</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {list.map((it, idx) => (
                            <tr key={idx} className="hover:bg-muted/10">
                              <td className="px-4 py-2">{it.description ?? '-'}</td>
                              <td className="px-4 py-2 text-right">{it.qty ?? '-'}</td>
                              <td className="px-4 py-2">{it.unit ?? '-'}</td>
                              <td className="px-4 py-2 text-right font-semibold">{formatMoney(it.amount_cents, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          If you have any questions about this invoice, please contact us.
        </div>
      </div>
    </div>
  )
}