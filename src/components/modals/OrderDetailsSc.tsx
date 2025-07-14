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

  useEffect(() => {
    if (!open || !order?.order_id) return;

    async function fetchOrderAndItems() {
      console.log('[🧪 Debug] order.order_id confirmado:', order.order_id);
      setLoading(true);

      const { data: full, error: fullErr } = await supabase
        .from('sellercloud_orders')
        .select('*')
        .eq('order_id', order.order_id)
        .maybeSingle()

      if (fullErr) {
        console.error('❌ Erro ao buscar order completo:', fullErr.message);
      } else {
        setFullOrder(full);
      }

      const { data: itemsData, error: itemsErr } = await supabase
        .from('sellercloud_order_items')
        .select('*')
        .eq('order_uuid', order.id)

      if (itemsErr) {
        console.error('❌ Erro ao buscar itens do pedido:', itemsErr.message);
      } else {
        console.log('[✅] Itens encontrados:', itemsData);
        setItems(itemsData || []);
      }

      setLoading(false);
    }

    fetchOrderAndItems();
  }, [open, order?.id, order?.order_id, supabase])

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl w-full bg-white font-sans text-sm print:bg-white print:text-black">
        <div className="flex justify-center pt-4">
          <img src="/logo_SynC_purple_red.png" alt="Sync Logo" className="h-30" />
        </div>
        <DialogHeader>
          <DialogTitle className="sr-only">Order Details</DialogTitle>
        </DialogHeader>

        {/* Order Header */}
        <div className="bg-primary text-white p-4 flex justify-between gap-4">
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
            <p>{order?.client_name || '—'}</p>
           
          </section>

          {/* Order Summary */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="font-semibold text-lg">Order Info</p>
              <p className="text-xs"><strong>Status:</strong> {order?.order_status || '—'}</p>
              <p className="text-xs"><strong>Payment:</strong> {order?.payment_status || '—'}</p>
              <p className="text-xs"><strong>Shipping:</strong> {order?.shipping_status || '—'}</p>
              <p className="text-xs"><strong>Marketplace:</strong> {order?.marketplace_name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Billing Info</p>
              <p className="text-xs"><strong>Name:</strong> {fullOrder?.metadata?.BillingAddress?.RecipientName || '—'}</p>
              <p className="text-xs"><strong>Address:</strong> {fullOrder?.metadata?.BillingAddress?.StreetLine1 || '—'}</p>
              <p className="text-xs">
                <strong>City:</strong> {fullOrder?.metadata?.BillingAddress?.City || '—'},{' '}
                {fullOrder?.metadata?.BillingAddress?.StateName || '—'} - {fullOrder?.metadata?.BillingAddress?.CountryName || '—'}
              </p>
              <p className="text-xs"><strong>ZIP:</strong> {fullOrder?.metadata?.BillingAddress?.Zip || '—'}</p>
            </div>
          </section>

          {/* Shipping & Delivery */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <table className="w-full text-xs border mb-6">
              <thead className="bg-primary/10 text-primary font-semibold text-left">
                <tr>
                  <th className="px-3 py-2 border">Item Description</th>
                  <th className="px-3 py-2 border">Quantity</th>
                  <th className="px-3 py-2 border">Unit Price</th>
                  <th className="px-3 py-2 border">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2 border">
                      <div>{item.sku}</div>
                      <div className="text-xs text-muted-foreground">{item?.metadata?.ProductName || '—'}</div>
                    </td>
                    <td className="px-3 py-2 border">{item.quantity}</td>
                    <td className="px-3 py-2 border">$ {item.unit_price?.toFixed(2)}</td>
                    <td className="px-3 py-2 border">$ {item.total_price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="bg-primary text-white text-right font-bold p-2 rounded space-y-1">
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