'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { FileText, Calendar, DollarSign } from 'lucide-react'

interface Props {
  order: any
  open: boolean
  onCloseAction: () => void
}

export default function OrderDetailsSc({ order, open, onCloseAction }: Props) {
  const supabase = useSupabase()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fullOrder, setFullOrder] = useState<any>(null)

  const getExtensivGrandTotal = (row: any): number | null => {
    const toNumber = (value: any): number | null => {
      const num = Number(value)
      return Number.isFinite(num) ? num : null
    }

    const direct = toNumber(row?.grand_total ?? row?.total_amount ?? row?.total)
    if (direct !== null) return direct

    let raw = row?.raw_data as any
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch (error) {
        raw = null
      }
    }

    const pickChargesArray = (): any[] | null => {
      if (Array.isArray(raw?.billing?.billingCharges)) return raw.billing.billingCharges
      if (Array.isArray(raw?.billingCharges)) return raw.billingCharges
      if (Array.isArray(raw?.charges)) return raw.charges
      return null
    }

    const charges = pickChargesArray()
    if (!charges) return null

    const total = charges.reduce((acc: number, charge: any) => {
      const subtotal = toNumber(charge?.subtotal)
      if (subtotal !== null) return acc + subtotal

      const detailsTotal = Array.isArray(charge?.details)
        ? charge.details.reduce((innerAcc: number, detail: any) => {
            const detailSubtotal = toNumber(detail?.subtotal)
            if (detailSubtotal !== null) return innerAcc + detailSubtotal

            const perUnit = toNumber(detail?.chargePerUnit)
            const units = toNumber(detail?.numUnits) ?? 1
            if (perUnit !== null && units > 0) return innerAcc + perUnit * units
            return innerAcc
          }, 0)
        : 0

      return acc + detailsTotal
    }, 0)

    return Number.isFinite(total) ? total : null
  }

  const parseSellercloudPayload = (rawOrder: any) => {
    let meta = rawOrder?.metadata
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta)
      } catch (error) {
        meta = null
      }
    }

    if (!meta || typeof meta !== 'object') {
      return { metadata: null, items: [] as any[] }
    }

    const billing = meta.BillingAddress || meta.billing || {}
    const shipping = meta.ShippingAddress || meta.shipping || {}
    const itemsMeta = Array.isArray(meta.Items) ? meta.Items : []

    const mappedItems = itemsMeta.map((item: any, index: number) => {
      const qty = Number(item?.Qty ?? item?.Quantity ?? item?.quantity ?? 0)
      const unit = Number(item?.UnitPrice ?? item?.SitePrice ?? item?.PricePerCase ?? item?.Price ?? 0)
      const total = Number(item?.LineTotal ?? item?.TotalPrice ?? item?.LineTotalPrice ?? unit * qty)
      return {
        id: item?.Id ?? item?.SKU ?? `sc-${index}`,
        sku: item?.SKU ?? item?.ProductID ?? item?.ProductName ?? '—',
        quantity: qty,
        unit_price: unit,
        total_price: total,
        metadata: item,
      }
    })

    const metadata = {
      BillingAddress: {
        RecipientName: billing?.RecipientName ?? billing?.Name ?? '',
        FirstName: billing?.FirstName ?? '',
        LastName: billing?.LastName ?? '',
        StreetLine1: billing?.StreetLine1 ?? billing?.Address1 ?? '',
        City: billing?.City ?? '',
        StateName: billing?.StateName ?? billing?.State ?? '',
        CountryName: billing?.CountryName ?? billing?.Country ?? '',
        Zip: billing?.Zip ?? billing?.ZipCode ?? '',
      },
      ShippingAddress: {
        RecipientName: shipping?.RecipientName ?? shipping?.Name ?? '',
        FirstName: shipping?.FirstName ?? '',
        LastName: shipping?.LastName ?? '',
        StreetLine1: shipping?.StreetLine1 ?? shipping?.Address1 ?? '',
        City: shipping?.City ?? '',
        StateName: shipping?.StateName ?? shipping?.State ?? '',
        CountryName: shipping?.CountryName ?? shipping?.Country ?? '',
        Zip: shipping?.Zip ?? shipping?.ZipCode ?? '',
      },
      ShippingCarrier: meta.ShippingCarrier ?? meta.Carrier ?? '',
      ShippingService: meta.ShippingService ?? meta.Service ?? '',
      TrackingNumber: meta.TrackingNumber ?? '',
      ShipDate: meta.ShipDate ?? rawOrder?.order_date ?? '',
      Items: mappedItems,
    }

    return { metadata, items: mappedItems }
  }

  const parseExtensivPayload = (rawOrder: any) => {
    let raw = rawOrder?.raw_data
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch (error) {
        raw = null
      }
    }

    if (!raw || typeof raw !== 'object') {
      return { metadata: null, items: [] as any[] }
    }

    const billTo = raw.billTo || raw.BillTo || {}
    const shipTo = raw.shipTo || raw.ShipTo || {}
    const routing = raw.routingInfo || {}
    const readOnly = raw.readOnly || {}
    const embeddedItems = raw._embedded?.['http://api.3plcentral.com/rels/orders/item'] || []

    const mappedItems = Array.isArray(embeddedItems)
      ? embeddedItems.map((item: any, index: number) => {
          const qty = Number(item?.qty ?? item?.readOnly?.originalPrimaryQty ?? 0)
          return {
            id: item?.readOnly?.orderItemId ?? item?.itemIdentifier?.id ?? `ext-${index}`,
            sku: item?.itemIdentifier?.sku ?? item?.itemIdentifier?.name ?? '—',
            quantity: qty,
            unit_price: null,
            total_price: null,
            metadata: {
              ProductName: item?.itemIdentifier?.name ?? item?.itemIdentifier?.sku ?? '—',
              Qty: qty,
            },
          }
        })
      : []

    const metadata = {
      BillingAddress: {
        RecipientName: billTo?.name ?? '',
        FirstName: billTo?.name ?? '',
        LastName: '',
        StreetLine1: billTo?.address1 ?? '',
        City: billTo?.city ?? '',
        StateName: billTo?.state ?? '',
        CountryName: billTo?.country ?? '',
        Zip: billTo?.zip ?? '',
      },
      ShippingAddress: {
        RecipientName: shipTo?.name ?? shipTo?.companyName ?? '',
        FirstName: shipTo?.name ?? '',
        LastName: '',
        StreetLine1: shipTo?.address1 ?? '',
        City: shipTo?.city ?? '',
        StateName: shipTo?.state ?? '',
        CountryName: shipTo?.country ?? '',
        Zip: shipTo?.zip ?? '',
      },
      ShippingCarrier: routing?.carrier ?? '',
      ShippingService: routing?.mode ?? '',
      TrackingNumber: rawOrder?.tracking_number ?? readOnly?.trackingNumber ?? raw?.trackingNumber ?? '',
      ShipDate: readOnly?.processDate ?? rawOrder?.process_date ?? rawOrder?.order_date ?? '',
      Items: mappedItems,
    }

    return { metadata, items: mappedItems }
  }

  const getPreferredCustomerName = () => {
    const first = String(
      fullOrder?.metadata?.FirstName ||
        fullOrder?.metadata?.ShippingAddress?.FirstName ||
        fullOrder?.metadata?.BillingAddress?.FirstName ||
        ''
    ).trim()
    const last = String(
      fullOrder?.metadata?.LastName ||
        fullOrder?.metadata?.ShippingAddress?.LastName ||
        fullOrder?.metadata?.BillingAddress?.LastName ||
        ''
    ).trim()
    const fullName = `${first} ${last}`.trim()
    if (fullName) return fullName

    return (
      order?.client_name ||
      fullOrder?.metadata?.CompanyName ||
      fullOrder?.metadata?.CustomerEmail ||
      '—'
    )
  }

  const getBillingName = () => {
    const recipient = String(fullOrder?.metadata?.BillingAddress?.RecipientName || '').trim()
    if (recipient) return recipient

    const first = String(fullOrder?.metadata?.BillingAddress?.FirstName || '').trim()
    const last = String(fullOrder?.metadata?.BillingAddress?.LastName || '').trim()
    const fullName = `${first} ${last}`.trim()
    if (fullName) return fullName

    return '—'
  }

  useEffect(() => {
    if (!open || (!order?.order_id && !order?.order_uuid && !order?.id)) return;

    async function fetchOrderAndItems() {
      setLoading(true);
      setItems([]);

      const orderUuid = order?.order_uuid || order?.id || order?.order_id || null
      const orderSource = String(order?.source || '').toLowerCase()

      let full: any = null
      let fullErr: any = null

      if (orderSource === 'sellercloud') {
        if (orderUuid) {
          const result = await supabase
            .from('sellercloud_orders')
            .select('*')
            .eq('id', orderUuid)
            .maybeSingle()
          full = result.data
          fullErr = result.error
        } else if (order?.order_id) {
          const result = await supabase
            .from('sellercloud_orders')
            .select('*')
            .eq('order_id', order.order_id)
            .maybeSingle()
          full = result.data
          fullErr = result.error
        }
      } else if (orderSource === 'extensiv') {
        const extensivId = (() => {
          if (order?.extensiv_order_id) return Number(order.extensiv_order_id)
          if (order?.id && /^\d+$/.test(String(order.id))) return Number(order.id)
          if (order?.order_id && /^\d+$/.test(String(order.order_id))) return Number(order.order_id)
          return null
        })()

        if (extensivId !== null) {
          const result = await supabase
            .from('extensiv_orders')
            .select('*')
            .eq('id', extensivId)
            .maybeSingle()
          full = result.data
          fullErr = result.error
        }
      } else {
        if (orderUuid) {
          const result = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderUuid)
            .maybeSingle()
          full = result.data
          fullErr = result.error
        } else if (order?.order_id) {
          const result = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', order.order_id)
            .maybeSingle()
          full = result.data
          fullErr = result.error
        }
      }

      if (fullErr) {
        console.error('❌ Erro ao buscar order completo:', fullErr.message);
      }

      let itemsData: any[] = []
      if (orderSource === 'extensiv') {
        const extensivId = (() => {
          if (order?.extensiv_order_id) return Number(order.extensiv_order_id)
          if (order?.id && /^\d+$/.test(String(order.id))) return Number(order.id)
          if (order?.order_id && /^\d+$/.test(String(order.order_id))) return Number(order.order_id)
          return null
        })()

        if (extensivId !== null) {
          const { data: savedItems, error: savedItemsErr } = await supabase
            .from('extensiv_order_items')
            .select('*')
            .eq('order_id', extensivId)

          if (savedItemsErr) {
            console.error('❌ Erro ao buscar itens do pedido (extensiv_order_items):', savedItemsErr.message);
          } else if (Array.isArray(savedItems) && savedItems.length > 0) {
            itemsData = savedItems
            setItems(savedItems)
          }
        }
      } else if (orderUuid) {
        const itemsQuery = orderSource === 'sellercloud'
          ? supabase.from('sellercloud_order_items').select('*').eq('order_uuid', orderUuid)
          : supabase.from('order_items').select('*').eq('order_id', orderUuid)

        const { data: savedItems, error: savedItemsErr } = await itemsQuery

        if (savedItemsErr) {
          console.error('❌ Erro ao buscar itens do pedido (order_items):', savedItemsErr.message);
        } else if (Array.isArray(savedItems) && savedItems.length > 0) {
          itemsData = savedItems
          setItems(savedItems)
        }
      }

      // If still no items, try raw items from passed order (e.g., extensiv payload)
      if (!itemsData.length && Array.isArray(order?.items)) {
        itemsData = order.items as any[]
        setItems(itemsData)
      }

      // Fallback: if not found in orders table, use the passed order data
      let resolvedOrder = full ?? order ?? null

      if (resolvedOrder && orderSource === 'extensiv') {
        const parsed = parseExtensivPayload(resolvedOrder)
        resolvedOrder = {
          ...resolvedOrder,
          metadata: {
            ...(resolvedOrder.metadata || {}),
            ...(parsed.metadata || {}),
          },
          grand_total: resolvedOrder.grand_total ?? getExtensivGrandTotal(resolvedOrder) ?? null,
        }

        if (!itemsData.length && parsed.items.length) {
          itemsData = parsed.items
          setItems(parsed.items)
        }
      }

      if (resolvedOrder && orderSource === 'sellercloud') {
        const parsed = parseSellercloudPayload(resolvedOrder)
        resolvedOrder = {
          ...resolvedOrder,
          metadata: {
            ...(resolvedOrder.metadata || {}),
            ...(parsed.metadata || {}),
          },
        }

        if (!itemsData.length && parsed.items.length) {
          itemsData = parsed.items
          setItems(parsed.items)
        }
      }

      if (resolvedOrder) {
        setFullOrder(resolvedOrder)
      }

      // Fallback: render line items directly from orders.metadata.Items
      // when order_items is empty for this order.
      const hasDbItems = Array.isArray(itemsData) && itemsData.length > 0
      const rawItems = Array.isArray(resolvedOrder?.metadata?.Items)
        ? resolvedOrder.metadata.Items
        : []
      if (!hasDbItems && rawItems.length > 0) {
        const mapped = rawItems.map((item: any, index: number) => {
          const quantity = Number(item?.Qty ?? item?.Quantity ?? 0)
          const unitPrice = Number(item?.UnitPrice ?? item?.SitePrice ?? item?.PricePerCase ?? item?.Price ?? 0)
          const totalPrice =
            Number(item?.LineTotal ?? item?.TotalPrice ?? item?.LineTotalPrice ?? unitPrice * quantity)

          return {
            id: `meta-${index}`,
            sku: item?.SKU || item?.ProductID || null,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            metadata: item,
          }
        })
        setItems(mapped)
      }

      setLoading(false);
    }

    fetchOrderAndItems();
  }, [open, order?.id, order?.order_id, order?.order_uuid, order?.source, supabase])

  const subtotalFromItems = items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0)
  const fallbackGrandTotal = fullOrder?.grand_total ?? order?.grand_total ?? null
  const effectiveSubtotal = subtotalFromItems > 0
    ? subtotalFromItems
    : fallbackGrandTotal ?? 0

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full md:max-w-3xl bg-white font-sans text-sm print:bg-white print:text-black rounded-md sm:rounded-xl max-h-[85vh] overflow-y-auto print:w-[95%] print:max-w-none print:mx-auto print:h-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
        <div className="flex justify-center pt-4">
          <img src="/logo_SynC_purple_red.png" alt="Sync Logo" className="h-30" />
        </div>
        <DialogHeader>
          <DialogTitle className="sr-only">Order Details</DialogTitle>
        </DialogHeader>

        {/* Order Header */}
        <div className="bg-primary text-white p-4 flex justify-between gap-4 print:bg-white print:text-black print:border-b print:border-black/10 print:pt-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3" /> Order No #
            </div>
            <span className="text-lg font-semibold">{order?.order_id || '—'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3" /> Marketplace ID
            </div>
            <span className="text-lg font-semibold">${order?.order_source_order_id || '—'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <Calendar className="w-3 h-3" /> Order Date
            </div>
            <span className="text-lg font-semibold">{order?.order_date?.split('T')[0] || '—'}</span>
          </div>
          
        </div>

        <div className="flex flex-col gap-4 mt-2 p-4 ">
          {/* Order To */}
          <section className="space-y-1">
            <p className="font-semibold text-lg">Order To:</p>
            <p>{getPreferredCustomerName()}</p>
           
          </section>

          {/* Order Summary */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid print:grid-cols-2 print:gap-8 print:break-inside-avoid">
            <div className="space-y-1">
              <p className="font-semibold text-lg">Order Info</p>
              <p className="text-xs"><strong>Status:</strong> {order?.order_status || '—'}</p>
              <p className="text-xs"><strong>Payment:</strong> {order?.payment_status || '—'}</p>
              <p className="text-xs"><strong>Shipping:</strong> {order?.shipping_status || '—'}</p>
              <p className="text-xs"><strong>Marketplace:</strong> {order?.marketplace_name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Billing Info</p>
              <p className="text-xs"><strong>Name:</strong> {getBillingName()}</p>
              <p className="text-xs"><strong>Address:</strong> {fullOrder?.metadata?.BillingAddress?.StreetLine1 || '—'}</p>
              <p className="text-xs">
                <strong>City:</strong> {fullOrder?.metadata?.BillingAddress?.City || '—'},{' '}
                {fullOrder?.metadata?.BillingAddress?.StateName || '—'} - {fullOrder?.metadata?.BillingAddress?.CountryName || '—'}
              </p>
              <p className="text-xs"><strong>ZIP:</strong> {fullOrder?.metadata?.BillingAddress?.Zip || '—'}</p>
            </div>
          </section>

          {/* Shipping & Delivery */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid print:grid-cols-2 print:gap-8 print:break-inside-avoid">
          <div className="space-y-1">
            <p className="font-semibold text-lg">Shipping & Delivery</p>
            <p className="text-xs"><strong>Carrier:</strong> {fullOrder?.metadata?.ShippingCarrier || '—'}</p>
            <p className="text-xs"><strong>Service:</strong> {fullOrder?.metadata?.ShippingService || '—'}</p>
            {fullOrder?.metadata?.TrackingNumber && (
              <p className="text-xs">
                <strong>Tracking:</strong>{' '}
                <a
                  href={`https://www.google.com/search?q=${fullOrder?.metadata?.TrackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                >
                  {fullOrder?.metadata?.TrackingNumber}
                </a>
              </p>
            )}
            </div>
            <div className="space-y-1">
            <p className="text-lg">-</p>
            <p className="text-xs"><strong>Ship Date:</strong> {fullOrder?.metadata?.ShipDate?.split('T')[0] || '—'}</p>
            <p className="text-xs"><strong>Promise Date:</strong> {fullOrder?.metadata?.OrderShippingPromiseDate?.split('T')[0] || '—'}</p>
            <p className="text-xs">
              <strong>Destination:</strong>{' '}
              {fullOrder?.metadata?.ShippingAddress?.City || '—'}, {fullOrder?.metadata?.ShippingAddress?.StateName || '—'} - {fullOrder?.metadata?.ShippingAddress?.CountryName || '—'}
            </p>
            </div>
          </section>

          {/* Items Table */}
          {loading ? (
            <p>Loading items...</p>
          ) : items.length === 0 ? (
            <p>No items found for this order.</p>
          ) : (
            <div className="mb-6 -mx-4 px-4 overflow-x-auto print:overflow-visible print:mx-0 print:px-0 print:break-inside-avoid">
              <table className="min-w-full text-xs border">
                <thead className="bg-primary/10 text-primary font-semibold text-left">
                  <tr>
                    <th className="px-3 py-2 border">Item Description</th>
                    <th className="px-3 py-2 border">Quantity</th>
                    <th className="px-3 py-2 border">Unit Price</th>
                    <th className="px-3 py-2 border">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const qty = Number(item.quantity ?? item?.metadata?.Qty ?? item?.metadata?.Quantity ?? 0)
                    const unit = Number(item.unit_price ?? item?.metadata?.UnitPrice ?? item?.metadata?.Price ?? 0)
                    const total = Number(item.total_price ?? unit * qty)
                    return (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2 border">
                        <div>{item.sku || item?.metadata?.SKU || '—'}</div>
                        <div className="text-xs text-muted-foreground">{item?.metadata?.ProductName || '—'}</div>
                      </td>
                      <td className="px-3 py-2 border">{qty}</td>
                      <td className="px-3 py-2 border">$ {unit.toFixed(2)}</td>
                      <td className="px-3 py-2 border">$ {total.toFixed(2)}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="bg-primary text-white text-right font-bold p-2 rounded space-y-1 print:bg-white print:text-black print:border print:border-black/10 print:break-inside-avoid">
            <p>
              Subtotal: $ {effectiveSubtotal.toFixed(2)}
            </p>
            <p>
              Grand Total: $ {fallbackGrandTotal !== null && fallbackGrandTotal !== undefined
                ? Number(fallbackGrandTotal).toFixed(2)
                : '—'}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 print:hidden">
            
            <button
              onClick={() => window.print()}
              className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded"
            >
              Print Order
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
