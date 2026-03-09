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
      console.log('[🧪 Debug] order confirmado:', order);
      setLoading(true);
      setItems([]);

      const orderUuid = order?.order_uuid || order?.id || null

      let full: any = null
      let fullErr: any = null

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

      if (fullErr) {
        console.error('❌ Erro ao buscar order completo:', fullErr.message);
      } else {
        setFullOrder(full);
      }

      let itemsData: any[] = []
      if (orderUuid) {
        const { data: savedItems, error: savedItemsErr } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderUuid)

        if (savedItemsErr) {
          console.error('❌ Erro ao buscar itens do pedido (order_items):', savedItemsErr.message);
        } else if (Array.isArray(savedItems) && savedItems.length > 0) {
          itemsData = savedItems
          setItems(savedItems)
        }
      }

      // Fallback: render line items directly from orders.metadata.Items
      // when order_items is empty for this order.
      const hasDbItems = Array.isArray(itemsData) && itemsData.length > 0
      const rawItems = Array.isArray((full || fullOrder)?.metadata?.Items)
        ? (full || fullOrder).metadata.Items
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
              Subtotal: $ {items.reduce((sum, i) => sum + (i.total_price || 0), 0).toFixed(2)}
            </p>
            <p>
              Grand Total: $ {order?.grand_total ? order.grand_total.toFixed(2) : '—'}
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
