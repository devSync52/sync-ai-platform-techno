'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface Props {
  order: any
  open: boolean
  onClose: () => void
}

export default function OrderDetailsSc({ order, open, onClose }: Props) {
  const supabase = useSupabaseClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !order?.id) return

    async function fetchItems() {
      setLoading(true)
      const { data, error } = await supabase
        .from('sellercloud_order_items')
        .select('*')
        .eq('order_uuid', order.id)

      if (error) {
        console.error('Error fetching order items:', error)
      } else {
        setItems(data)
      }

      setLoading(false)
    }

    fetchItems()
  }, [open, order?.id, supabase])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Order Details - {order?.order_id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p><strong>Client:</strong> {order?.client_name}</p>
          <p><strong>Marketplace:</strong> {order?.marketplace}</p>
          <p><strong>Status:</strong> {order?.status}</p>
          <p><strong>Order Date:</strong> {order?.order_date?.split('T')[0]}</p>
          <p><strong>Grand Total:</strong> $ {order?.total_amount?.toFixed(2)}</p>
        </div>

        <hr className="my-4" />

        <h3 className="text-lg font-semibold">Items</h3>
        {loading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <p>No items found for this order.</p>
        ) : (
          <table className="w-full text-sm border mt-2">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 border">SKU</th>
                <th className="px-3 py-2 border">Quantity</th>
                <th className="px-3 py-2 border">Unit Price</th>
                <th className="px-3 py-2 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-3 py-2 border">{item.sku}</td>
                  <td className="px-3 py-2 border">{item.quantity}</td>
                  <td className="px-3 py-2 border">$ {item.unit_price?.toFixed(2)}</td>
                  <td className="px-3 py-2 border">$ {item.total_price?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  )
}